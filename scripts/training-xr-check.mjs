import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join, resolve} from 'node:path';
import {chromium} from 'playwright-core';

// Run the local preview first, then pass the IWER UMD file and optionally the training URL.
const root = resolve(import.meta.dirname, '..');
const [runtimeFile, url = 'http://127.0.0.1:4496/training/'] = process.argv.slice(2);
if (!runtimeFile) throw new Error('Usage: node scripts/training-xr-check.mjs <iwer.min.js> [training URL]');
const revision = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const dirty = execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim().length > 0;
const folder = join(root, 'artifacts', 'xr-practice-' + (dirty ? 'draft' : revision.slice(0,7)));
await mkdir(folder,{recursive:true});
const runtime = await readFile(runtimeFile,'utf8');
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--disable-gpu-shader-disk-cache']});
const page = await browser.newPage({viewport:{width:1280,height:960},reducedMotion:'reduce'});
const errors = [];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',entry=>{if(entry.type()==='error'&&!entry.location().url.endsWith('/favicon.ico'))errors.push(entry.text());});
try {
  await page.addInitScript({content:runtime + `
    ;{
      const lib = window.IWER || window.iwer;
      window.xrDevice = new lib.XRDevice(lib.metaQuest3);
      window.xrDevice.installRuntime({forceInstall:true});
      window.xrDevice.position.set(0,1.60,0);
      window.xrDevice.quaternion.set(0,0,0,1);
      window.xrDevice.fovy = Math.PI / 2;
      window.xrDevice.controllers.left.position.set(-.8,1.2,-.25);
      const nativeRequest = navigator.xr.requestSession.bind(navigator.xr);
      navigator.xr.requestSession = async (...args) => {
        window.qaSession = await nativeRequest(...args);
        window.qaEvents = [];
        for (const type of ['selectstart','select','selectend','end']) {
          window.qaSession.addEventListener(type, () => window.qaEvents.push(type));
        }
        return window.qaSession;
      };
    }
  `});
  await page.goto(url);
  await page.locator('#scene canvas').waitFor();
  const entry = page.locator('#vr-practice');
  assert(await entry.isHidden());
  await page.getByRole('button',{name:'マスククリア',exact:true}).click();
  await page.locator('#mask-fill').selectOption('mask-full');
  await page.locator('#recall').click();
  await entry.waitFor();

  const progress = () => page.locator('#progress').getAttribute('aria-valuenow');
  const water = () => page.locator('#mask-overlay').evaluate(node=>parseFloat(node.style.getPropertyValue('--mask-water')));
  async function start() {
    await entry.click();
    await page.waitForFunction(()=>window.qaSession?.renderState.baseLayer||window.qaSession?.renderState.layers?.length);
    await page.waitForTimeout(750);
    assert(await entry.isDisabled());
  }
  async function aim([x,y]) {
    await page.evaluate(({x,y})=>{
      const source = window.xrDevice.controllers.right;
      source.position.set((x/1024-.5)*.99,1.60-.33+(.5-y/346)*.3345,-.25);
      source.quaternion.set(0,0,0,1);
    },{x,y});
    await page.waitForTimeout(210);
  }
  const trigger = value => page.evaluate(value=>window.xrDevice.controllers.right.updateButtonValue('trigger',value),value);
  async function hold(target,ms=140) {
    await aim(target);
    await trigger(1);
    await page.waitForTimeout(ms);
    await trigger(0);
    await page.waitForTimeout(180);
  }
  const breathe=[184,215], seal=[512,215], exhale=[840,215], exit=[892,57];
  await page.evaluate(() => {
    const original = navigator.xr.requestSession;
    navigator.xr.requestSession = async () => {
      navigator.xr.requestSession = original;
      throw new DOMException('XR session denied', 'NotAllowedError');
    };
  });
  await entry.click();
  await page.waitForFunction(() => document.querySelector('#feedback')?.textContent.includes('VRを開始できませんでした'));
  assert(await entry.isEnabled());
  assert.equal(await progress(), '0');
  await start();
  const capture = name => page.screenshot({path:folder+'/'+name+'.png'});
  await capture('flooded');
  await hold(seal);
  assert.equal(await progress(),'0');
  assert.equal(await page.locator('#feedback').getAttribute('data-tone'),'retry');
  await hold(breathe);
  assert.equal(await progress(),'1');
  await hold(seal);
  assert.equal(await progress(),'2');
  await hold(exhale,720);
  const partial = await water();
  assert(partial>0&&partial<100,'Expected a partial clear, got '+partial);
  await page.waitForTimeout(300);
  assert.equal(await water(),partial);
  const straight = await capture('partial');
  await page.evaluate(()=>{
    const a=.17;
    window.xrDevice.quaternion.set(0,Math.sin(a),0,Math.cos(a));
  });
  await page.waitForTimeout(300);
  assert(!(await capture('look-left')).equals(straight), 'A headset turn changes the rendered view');
  await page.evaluate(()=>window.xrDevice.quaternion.set(0,0,0,1));
  await hold(exit);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  assert.equal(await progress(),'2');
  assert.equal(await water(),partial);
  assert(await entry.isEnabled());
  await page.reload();
  await page.locator('#resume-practice').click();
  assert.equal(await progress(),'2');
  assert.equal(await water(),partial);
  await page.evaluate(() => { window.xrDevice.stereoEnabled = true; });
  await start();
  const eyes = await page.evaluate(async () => {
    const session = window.qaSession;
    const space = await session.requestReferenceSpace('local');
    return new Promise(resolve => session.requestAnimationFrame((_, frame) => resolve(frame.getViewerPose(space).views.length)));
  });
  assert.equal(eyes, 2);
  await aim(exhale);
  await trigger(1);
  await page.waitForTimeout(350);
  await page.evaluate(() => window.qaSession.end());
  await trigger(0);
  assert.equal(await progress(), '2');
  const interrupted = await water();
  assert(interrupted > 0 && interrupted < partial, 'Ending the session preserves the partially cleared water');
  await start();
  await hold(exhale,2250);
  assert.equal(await progress(),'3');
  assert.equal(await water(),0);
  await capture('cleared');
  await hold(exit);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  const review = await page.evaluate(()=>JSON.parse(localStorage.getItem('dive-atlas.owd-review.v1.mask')));
  assert.equal(review.route,'mask-full');
  assert.deepEqual(review.steps,['mask-breathe']);
  await page.locator('#result').waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'result-heading');

  await page.getByRole('button',{name:'レギュレーター回収',exact:true}).click();
  const aimAt = async target => {
    await page.evaluate(([x,y,z]) => {
      const source = window.xrDevice.controllers.right;
      source.position.set(.32,1.21,-.18);
      const dx = x - .32, dy = y - 1.21, dz = z + .18;
      const yaw = -Math.atan2(dx, -dz) / 2;
      const pitch = Math.atan2(dy, Math.hypot(dx, dz)) / 2;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      source.quaternion.set(cy * sp, sy * cp, -sy * sp, cy * cp);
    }, target);
    await page.waitForTimeout(200);
  };
  const use = async (target, ms=140) => {
    await aimAt(target);
    await trigger(1);
    await page.waitForTimeout(ms);
    await trigger(0);
    await page.waitForTimeout(180);
  };
  const look = async yaw => {
    await page.evaluate(yaw => window.xrDevice.quaternion.set(0,Math.sin(yaw/2),0,Math.cos(yaw/2)),yaw);
    await page.waitForTimeout(220);
  };
  const recoveryPanel = (x,y) => [-.41+(x/1024-.5)*.99,1.60-.81+(.5-y/346)*.3345,-1.22];
  const releaseBubbles = recoveryPanel(250,215);
  const resumeBreathing = recoveryPanel(762,215);
  const leaveRecovery = recoveryPanel(892,57);
  const sweepPoint = [1.60,1.24,-.80];
  const regulatorPoint = [.35,1.29,-1.29];
  const mouthPoint = [.02,1.28,-.87];
  const chestPoint = [-.38,1.15,-1.02];
  const purgePoint = [-.026,1.34,-.81];
  const pausedSweep = () => page.evaluate(() => JSON.parse(localStorage.getItem('dive-atlas.owd-draft.v1'))?.progress ?? 0);

  await page.evaluate(() => { window.xrDevice.stereoEnabled = false; });
  await start();
  await use(releaseBubbles);
  assert.equal(await progress(),'1');
  await use(sweepPoint,300);
  assert.equal(await pausedSweep(),0,'The hose control stays inactive while facing forward');
  await look(-1.10);
  const rightView = await capture('recovery-search');
  await use(sweepPoint,1080);
  const sweepPartial = await pausedSweep();
  assert(sweepPartial>0&&sweepPartial<1);
  assert.equal(await progress(),'1');
  assert(!(await capture('recovery-paused')).equals(rightView));
  await look(0);
  await use(leaveRecovery);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  await page.reload();
  await page.locator('#resume-practice').click();
  assert.equal(await progress(),'1');
  assert.equal(await pausedSweep(),sweepPartial);
  await start();
  await look(-1.10);
  await use(sweepPoint,1800);
  assert.equal(await progress(),'2');
  await look(0);
  await use(regulatorPoint);
  await capture('recovery-docking');
  await use(chestPoint);
  assert.equal(await progress(),'2');
  assert.match(await page.locator('#feedback').innerText(),/位置が違います/);
  await use(regulatorPoint);
  await use(mouthPoint);
  assert.equal(await progress(),'3');
  await use(purgePoint,740);
  assert.equal(await progress(),'4');
  await use(resumeBreathing);
  assert.equal(await progress(),'5');
  await use(leaveRecovery);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  const sweepReview = await page.evaluate(()=>JSON.parse(localStorage.getItem('dive-atlas.owd-review.v1.recovery')));
  assert.deepEqual(sweepReview.steps,['replace']);

  await page.locator('#recovery-search').selectOption('reach');
  await page.locator('#recovery-clear').selectOption('exhale');
  await start();
  await use(releaseBubbles);
  await look(-1.15);
  await use([.69,1.34,-.25]);
  assert.equal(await progress(),'2');
  await use([.94,1.38,-.39],1680);
  assert.equal(await progress(),'3');
  await look(0);
  await use(regulatorPoint);
  await use(mouthPoint);
  assert.equal(await progress(),'4');
  await use([-.185,1.21,-.96],1600);
  assert.equal(await progress(),'5');
  await use(resumeBreathing);
  assert.equal(await progress(),'6');
  await use(leaveRecovery);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  const reachReview = await page.evaluate(()=>JSON.parse(localStorage.getItem('dive-atlas.owd-review.v1.recovery')));
  assert.equal(reachReview.route,'reach-exhale');
  assert.deepEqual(reachReview.steps,[]);
  assert.deepEqual(errors,[]);
  await writeFile(folder+'/report.json',JSON.stringify({revision,dirty,runtime:'IWER 2.8.0, Meta Quest 3 profile, Chrome',checks:['XR button gated by lesson','Session denial keeps the desktop practice available','Tracked controller ray and trigger enforce step order','Press and release preserve partly cleared water','Head pose changes rendered view','In-world exit restores 2D at same step','Reload resumes exact water level','Stereo renders two eye views','System exit during a hold preserves partial progress','Reenter VR and finish','Recall saves the expected review and exiting focuses the result','Facing the hose unlocks the XR sweep and a partial hold moves the arm','Leaving XR and reloading resumes the same recovery hold','World-space selection checks the mouth dock before purge and saves mistakes','Shoulder trace and exhale complete the alternate recovery route']},null,2));
  console.log(folder);
} catch(error) {
  console.log(JSON.stringify({errors, browser:await page.evaluate(()=>({iwer:!!window.xrDevice,events:window.qaEvents,session:!!window.qaSession,feedback:document.querySelector('#feedback')?.textContent}))}));
  await page.screenshot({path:folder+'/failed.png'}).catch(()=>{});
  throw error;
} finally { await browser.close(); }
