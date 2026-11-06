import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join, resolve} from 'node:path';
import {chromium} from 'playwright-core';

// Run the local preview first. The optional profile changes input, not browser or optics.
const root = resolve(import.meta.dirname, '..');
const [runtimeFile, url = 'http://127.0.0.1:4496/training/', profile = 'quest3'] = process.argv.slice(2);
if (!runtimeFile || !['quest3','pico-4'].includes(profile)) {
  throw new Error('Usage: node scripts/training-xr-check.mjs <iwer.min.js> [training URL] [quest3|pico-4]');
}
// https://github.com/immersive-web/webxr-input-profiles/blob/main/packages/registry/profiles/pico/pico-4.json
const picoLayout = (first, second) => ({
  numHapticActuators: 1,
  gamepad: {
    mapping: 'xr-standard',
    buttons: [
      { id: 'trigger', type: 'analog', eventTrigger: 'select' },
      { id: 'squeeze', type: 'analog', eventTrigger: 'squeeze' },
      null,
      ...['thumbstick', first, second].map(id => ({ id, type: 'binary' }))
    ],
    axes: [null, null, { id: 'thumbstick', type: 'x-axis' }, { id: 'thumbstick', type: 'y-axis' }]
  }
});
const picoDevice = {
  name: 'PICO 4 input profile',
  controllerConfig: {
    profileId: 'pico-4',
    fallbackProfileIds: ['generic-trigger-squeeze-thumbstick'],
    layout: { left: picoLayout('x-button','y-button'), right: picoLayout('a-button','b-button') }
  },
  supportedSessionModes: ['inline','immersive-vr'],
  supportedFeatures: ['viewer','local'],
  supportedFrameRates: [72,90],
  isSystemKeyboardSupported: false,
  internalNominalFrameRate: 72,
  environmentBlendModes: { 'immersive-vr': 'opaque' },
  interactionMode: 'world-space'
};
const revision = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const dirty = execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim().length > 0;
const folder = join(root, 'artifacts', 'xr-practice-' + (dirty ? 'draft' : revision.slice(0,7)) + (profile === 'pico-4' ? '-pico-4' : ''));
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
      const pico = ${JSON.stringify(profile === 'pico-4' ? picoDevice : null)};
      window.xrDevice = new lib.XRDevice(pico ? { ...pico, userAgent: navigator.userAgent } : lib.metaQuest3);
      window.xrDevice.installRuntime({forceInstall:true});
      const getPose = XRFrame.prototype.getPose;
      XRFrame.prototype.getPose = function(space, baseSpace) {
        return window.qaMissingRays?.has(space) ? null : getPose.call(this, space, baseSpace);
      };
      window.xrDevice.position.set(0,1.60,0);
      window.xrDevice.quaternion.set(0,0,0,1);
      window.xrDevice.fovy = Math.PI / 2;
      window.qaPanelText = [];
      window.qaPanelPoints = {};
      const fillText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
        if (this.canvas.width === 1024 && this.canvas.height === 346) {
          if (x === 32 && y === 58) {
            window.qaPanelText = [];
            window.qaPanelPoints = {};
          }
          window.qaPanelText.push(String(value));
          window.qaPanelPoints[String(value)] = { x, y };
        }
        return fillText.call(this, value, x, y, ...rest);
      };
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
  await entry.waitFor();
  await page.locator('#show-example').click();
  assert(await entry.isHidden());
  await page.locator('#example-exit').click();
  await page.getByRole('button',{name:'マスククリア',exact:true}).click();
  await page.locator('#mask-fill').selectOption('mask-full');
  assert.equal(await page.locator('#recall').getAttribute('aria-pressed'),'false');
  await entry.waitFor();

  const progress = () => page.locator('#progress').getAttribute('aria-valuenow');
  const panelHas = (...expected) => page.waitForFunction(text =>
    text.every(line => window.qaPanelText.includes(line)), expected);
  const water = () => page.locator('#mask-overlay').evaluate(node=>parseFloat(node.style.getPropertyValue('--mask-water')));
  async function start() {
    await entry.click();
    await page.waitForFunction(()=>window.qaSession?.renderState.baseLayer||window.qaSession?.renderState.layers?.length);
    await page.waitForTimeout(750);
    assert(await entry.isDisabled());
  }
  async function aim([x,y], hand = 'right') {
    await page.evaluate(({x,y,hand})=>{
      const source = window.xrDevice.controllers[hand];
      source.position.set((x/1024-.5)*.99,1.60-.33+(.5-y/346)*.3345,-.25);
      source.quaternion.set(0,0,0,1);
    },{x,y,hand});
    await page.waitForTimeout(210);
  }
  const trigger = (value, hand = 'right') => page.evaluate(({value,hand})=>
    window.xrDevice.controllers[hand].updateButtonValue('trigger',value),{value,hand});
  async function hold(target,ms=140,hand='right') {
    await aim(target,hand);
    await trigger(1,hand);
    await page.waitForTimeout(ms);
    await trigger(0,hand);
    await page.waitForTimeout(180);
  }
  const breathe=[184,215], seal=[512,215], exhale=[840,215], exit=[892,57];
  const hintButton=[506,57];
  const exampleEntry=[678,57], examplePrevious=[135,298], examplePlay=[370,298], exampleNext=[602,298], exampleRecall=[857,298];
  const storedDraft = () => page.evaluate(() => localStorage.getItem('dive-atlas.owd-draft.v1'));
  const exampleWater = () => page.evaluate(() => {
    const text = window.qaPanelText.find(line => line.startsWith('マスク内の水 '));
    return text ? parseInt(text.slice('マスク内の水 '.length),10) : null;
  });
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
  const draftBeforeDemo = await storedDraft();
  await page.evaluate(() => { window.sessionBeforeDemo = window.qaSession; });
  await hold(exampleEntry);
  await panelHas('見本  1 / 3','口で呼吸する','マスク内の水 100%');
  await panelHas('見本  2 / 3','マスクの上側を押さえる');
  await hold(examplePlay);
  await panelHas('再生');
  await hold(examplePrevious);
  await panelHas('見本  1 / 3','再生');
  await hold(exampleNext);
  await panelHas('見本  2 / 3','マスクの上側を押さえる','再生');
  await hold(exampleNext);
  await panelHas('見本  3 / 3','鼻から息を吐く','再生');
  await hold(examplePlay);
  await page.waitForFunction(() => window.qaPanelText.some(line => /^マスク内の水 (?:[2-8][05]|90)%$/.test(line)));
  await hold(examplePlay);
  await panelHas('再生');
  const demonstrationWater = await exampleWater();
  assert(demonstrationWater > 0 && demonstrationWater < 100);
  await page.waitForTimeout(360);
  assert.equal(await exampleWater(),demonstrationWater);
  assert.equal(await progress(),'0');
  assert.equal(await water(),100);
  assert.equal(await storedDraft(),draftBeforeDemo);
  await capture('mask-example-paused');
  await hold(exampleNext);
  await panelHas('見本はここまで','自力で復習 ›');
  await hold(exampleRecall);
  await panelHas('マスククリア   0 / 3','見本を見る');
  assert(await page.evaluate(() => window.qaSession === window.sessionBeforeDemo && !window.qaEvents.includes('end')));
  assert.equal(await page.locator('#recall').getAttribute('aria-pressed'),'true');
  assert.equal(await progress(),'0');
  assert.equal(await water(),100);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dive-atlas.owd-draft.v1')).resumeAtStart),true);
  await capture('flooded');
  await hold(seal);
  assert.equal(await progress(),'0');
  assert.equal(await page.locator('#feedback').getAttribute('data-tone'),'retry');
  await hold(breathe);
  assert.equal(await progress(),'1');
  await page.evaluate(()=>{
    const controller = window.xrDevice.controllers.right;
    controller.position.set(.224,1.858,-.25);
    controller.quaternion.set(0,0,0,1);
  });
  await page.waitForTimeout(210);
  await capture('mask-rim-before');
  await trigger(1);
  await page.waitForTimeout(140);
  await trigger(0);
  await panelHas('マスククリア   2 / 3');
  assert.equal(await progress(),'2');
  assert(await page.locator('#mask-overlay').evaluate(node => node.classList.contains('is-sealed')));
  await capture('mask-rim-pressed');
  await hold(breathe);
  assert.equal(await progress(),'2');
  assert.equal(await page.locator('#feedback').getAttribute('data-tone'),'retry');
  await hold(exhale,720);
  const partial = await water();
  assert(partial>0&&partial<100,'Expected a partial clear, got '+partial);
  await page.waitForTimeout(300);
  assert.equal(await water(),partial);
  const savedPartial = await storedDraft();
  await hold(exampleEntry);
  await panelHas('見本  1 / 3');
  await hold(exampleEntry);
  await panelHas('マスククリア   2 / 3','見本を見る');
  assert.equal(await storedDraft(),savedPartial);
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
  await panelHas('ヒント','マスククリア   2 / 3');
  await hold(hintButton);
  await panelHas('鼻から息を吐く');
  assert(await page.evaluate(() => !window.qaPanelText.includes('ヒント')));
  assert.equal(await progress(),'2');
  assert.equal(await water(),partial);
  assert.deepEqual(JSON.parse(await storedDraft()).assisted,['mask-exhale']);
  await capture('mask-hint-in-vr');
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
  await panelHas('鼻から息を吐く');
  assert(await page.evaluate(() => !window.qaPanelText.includes('ヒント')));
  await hold(exhale,2250);
  assert.equal(await progress(),'3');
  assert.equal(await water(),0);
  await capture('cleared');
  await panelHas('見直す手順は2つ','見直す手順を見る');
  const maskReviewBefore = await page.evaluate(() => localStorage.getItem('dive-atlas.owd-review.v1.mask'));
  await hold([260,215]);
  await panelHas('見直し  1 / 2','口で呼吸する','結果に戻る','やり直し');
  await hold([850,298]);
  await panelHas('見直し  2 / 2','鼻から息を吐く','見本を再生','やり直し・ヒント');
  await capture('mask-review-vr');
  await hold(exampleEntry);
  await panelHas('見直しの見本','鼻から息を吐く','見直しに戻る','マスク内の水 100%');
  await page.waitForFunction(() => window.qaPanelText.some(line => /^マスク内の水 (?:[2-8][05]|90)%$/.test(line)));
  await capture('mask-review-replay');
  await panelHas('見直しの見本','鼻から息を吐く','マスク内の水 0%','もう一度見る');
  assert(await page.evaluate(() => !window.qaPanelText.some(line => ['次の手順 ›','自力で復習 ›'].includes(line))));
  await hold([512,298]);
  await panelHas('マスク内の水 100%','一時停止');
  await hold(exampleEntry);
  await panelHas('見直し  2 / 2','鼻から息を吐く','見本を再生');
  assert.equal(await progress(),'3');
  assert.equal(await water(),0);
  assert.equal(await storedDraft(),null);
  assert.equal(await page.evaluate(() => localStorage.getItem('dive-atlas.owd-review.v1.mask')),maskReviewBefore);
  await hold([512,298]);
  await panelHas('見直す手順は2つ','この種目をもう一度 ›');
  const review = await page.evaluate(()=>JSON.parse(localStorage.getItem('dive-atlas.owd-review.v1.mask')));
  assert.equal(review.route,'mask-full');
  assert.deepEqual(review.steps,['mask-breathe','mask-exhale']);
  assert.deepEqual(review.reasons, { 'mask-breathe': 'retry', 'mask-exhale': 'retry-and-hint' });
  await capture('mask-retry-result');
  await page.evaluate(() => { window.sessionBeforeRetry = window.qaSession; });
  await hold([512,298]);
  await panelHas('マスククリア   0 / 3','マスク内の水 100%');
  assert(await page.evaluate(() => window.sessionBeforeRetry === window.qaSession));
  assert.equal(await page.locator('#recall').getAttribute('aria-pressed'),'true');
  assert.equal(await water(),100);
  const maskRetry = JSON.parse(await storedDraft());
  assert.equal(maskRetry.route,'mask-full');
  assert.equal(maskRetry.resumeAtStart,true);
  assert.deepEqual(maskRetry.done,[]);
  assert.equal(await page.evaluate(() => localStorage.getItem('dive-atlas.owd-review.v1.mask')),maskReviewBefore);
  await hold(breathe);
  await hold(seal);
  await hold(exhale,2250);
  await panelHas('練習完了 · 見直す手順なし');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('dive-atlas.owd-review.v1.mask')).steps),[]);
  await hold(exit);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
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
  assert.equal(await page.locator('#feedback').innerText(),'ホースが右腕に掛かりました。');
  await use(regulatorPoint);
  await panelHas('取り付け先に照準を合わせる');
  assert(await page.evaluate(() => !window.qaPanelText.some(line => line.includes('「口元」を選ぶ'))));
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
  const reachReview = await page.evaluate(()=>JSON.parse(localStorage.getItem('dive-atlas.owd-review.v1.recovery')));
  assert.equal(reachReview.route,'reach-exhale');
  assert.deepEqual(reachReview.steps,[]);
  const rememberSession = () => page.evaluate(() => { window.sessionBeforeNext = window.qaSession; });
  const sameSession = () => page.evaluate(() => window.qaSession === window.sessionBeforeNext && !window.qaEvents.includes('end'));
  await rememberSession();
  await panelHas('インフレーターへ ›');
  await use(recoveryPanel(512,215));
  await panelHas('パワーインフレーター   0 / 4','BCDのふくらみ');
  assert(await sameSession());
  assert.equal(await progress(),'0');

  const inflatorPanel = (x,y) => [-.52+(x/1024-.5)*.99,1.60-.94+(.5-y/346)*.3345,-1.28];
  const height = air => .20 + 1.08 * (air - .48);
  const buttonPoint = (air, raised, x, y, z) => {
    const tilt = -.13, scale = 1.55;
    return [.61+scale*(x*Math.cos(tilt)-y*Math.sin(tilt)),
      1.43+height(air)+(raised ? .68 : -.44)+scale*(x*Math.sin(tilt)+y*Math.cos(tilt)),
      .23+scale*z-2.43];
  };
  // Aim at the caps themselves, separate from the labels beside the controls.
  const addPoint = buttonPoint(0,false,0,.058,.099);
  const handlePoint = buttonPoint(.48,false,-.045,.365,.066);
  const ventPoint = air => buttonPoint(air,true,0,-.128,.097);
  const trimPoint = (air, add) => add ? buttonPoint(air,true,0,.058,.099) : ventPoint(air);
  const dockAbove = [.52,2.40,-2.04];
  const dockBelow = [.52,1.01,-2.02];
  const leaveInflator = inflatorPanel(892,57);
  const confirmHeight = inflatorPanel(512,215);
  const airLevel = () => page.locator('#effect-meter').evaluate(node => Number(node.style.getPropertyValue('--level')));
  const balanceCue = () => page.locator('#buoyancy-status').innerText();

  await aimAt(addPoint);
  const beforeAir = await capture('inflator-empty');
  await use(addPoint,460);
  assert.equal(await progress(),'1');
  assert.equal(await airLevel(),.48);
  assert(!(await capture('inflator-filled')).equals(beforeAir));
  await use(handlePoint);
  await use(dockBelow);
  assert.equal(await progress(),'1');
  assert.match(await page.locator('#feedback').innerText(),/位置が違います/);
  await use(handlePoint);
  await use(dockAbove);
  assert.equal(await progress(),'2');
  await aimAt(ventPoint(.48));
  await page.evaluate(async () => {
    const controller = window.xrDevice.controllers.right;
    controller.updateButtonValue('trigger',1);
    await new Promise(resolve => setTimeout(resolve,250));
    controller.updateButtonValue('trigger',0);
  });
  await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('途中で止まりました'));
  await capture('inflator-vent-paused');
  const interruptedAir = await airLevel();
  assert(interruptedAir>0&&interruptedAir<.48);
  await use(leaveInflator);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  await page.reload();
  await page.locator('#resume-practice').click();
  assert.equal(await progress(),'2');
  assert.equal(await airLevel(),interruptedAir);
  await start();
  await use(ventPoint(interruptedAir),950);
  assert.equal(await progress(),'3');
  assert.equal(await airLevel(),0);
  assert.equal(await balanceCue(),'沈み気味');
  await use(confirmHeight);
  assert.equal(await progress(),'3');
  for(const air of [0,.16,.32,.48]) await use(trimPoint(air,true));
  assert.equal(await airLevel(),.64);
  assert.equal(await balanceCue(),'浮き気味');
  const high = await capture('inflator-rise');
  await use(trimPoint(.64,false));
  assert.equal(await airLevel(),.48);
  assert.equal(await balanceCue(),'高さが安定');
  assert(!(await capture('inflator-steady')).equals(high));
  await use(confirmHeight);
  assert.equal(await progress(),'4');
  await rememberSession();
  await panelHas('見直す手順は2つ','フィンの履き方へ ›');
  await use(inflatorPanel(766,215));
  await panelHas('フィンの履き方   0 / 5','足元の部品を選ぶ');
  assert(await sameSession());
  assert.equal(await progress(),'0');
  const inflatorReview = await page.evaluate(()=>JSON.parse(localStorage.getItem('dive-atlas.owd-review.v1.inflator')));
  assert.deepEqual(inflatorReview.steps,['raise','balance']);
  const setupFins = async sample => {
    await page.locator('#guided').click();
    await page.evaluate(sample => {
      const random = Math.random;
      try {
        Math.random = () => sample;
        document.querySelector('#recall').click();
      } finally { Math.random = random; }
    }, sample);
    await pitch(0);
    await start();
  };
  const pitch = async angle => {
    await page.evaluate(angle => window.xrDevice.quaternion.set(Math.sin(angle/2),0,0,Math.cos(angle/2)), angle);
    await page.waitForTimeout(200);
  };
  const finsPanel = (x,y) => [-.94+(x/1024-.5)*.99,1.60-.35+(.5-y/346)*.3345,-1.45];
  const leaveFins = finsPanel(892,57);
  const goodFit = finsPanel(260,215);
  const looseFit = finsPanel(766,215);
  const finPoint = async (id, done, scenario='loose', lift=0) => page.evaluate(async ({id,done,scenario,lift}) => {
    const { Group, Vector3 } = await import(new URL('../vendor/three.module.js', location));
    const { lessons } = await import(new URL('lessons.js', location));
    const { makeDiveModel } = await import(new URL('models.js', location));
    const modelRoot = new Group();
    modelRoot.position.set(0, 1.60, 0);
    const model = makeDiveModel(modelRoot, lessons.find(lesson=>lesson.id==='fins'), scenario);
    model.update(new Set(done),1,240,{pressure:{'fin-wiggle':lift}});
    model.sync();
    const anchor = id === 'fin-part-boot' ? 'fin-wiggle' : id === 'fin-part-strap' ? 'fin-strap' : id;
    const [part, offset] = model.anchors[anchor] || model.docks[id];
    const point = offset.clone();
    point.y += model.docks[id] ? .12 : .14;
    if (id === 'fin-part-boot') point.x -= .20;
    return part.localToWorld(point).sub(new Vector3(0,1.53,1.25)).toArray();
  }, {id,done,scenario,lift});
  const bootIn = ['fin-strap','fin-foot'];
  const strapped = [...bootIn,'fin-lock'];
  const wiggled = [...strapped,'fin-wiggle'];
  const grab = async (from,to,during=async()=>{}) => {
    await aimAt(from);
    await trigger(1);
    await page.waitForTimeout(200);
    await aimAt(to);
    await during();
    await trigger(0);
    await page.waitForTimeout(180);
  };
  const chooseFin = async (part, label, done, scenario='loose', lift=0, ms=140) => {
    const strap = part === 'strap';
    await use(await finPoint(strap ? 'fin-part-strap' : 'fin-part-boot',done,scenario,lift));
    await panelHas(strap ? 'ストラップで何をする？' : 'ブーツで何をする？',label);
    const { x, y } = await page.evaluate(text => window.qaPanelPoints[text],label);
    await use(finsPanel(x+22,y),ms);
  };
  await pitch(-.65);
  await capture('fins-from-inflator');
  await chooseFin('strap','外側へよける',[]);
  assert.equal(await progress(),'1');
  assert(await sameSession());
  await pitch(0);
  await use(leaveFins);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  await page.locator('#guided').click();
  await start();
  await pitch(-.65);
  await panelHas('ストラップを外側へ');
  await use(await finPoint('fin-strap',[],'walkthrough'));
  assert.equal(await progress(),'1');
  await pitch(0);
  await use(leaveFins);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));

  await page.reload();
  await page.getByRole('button',{name:'フィンの履き方',exact:true}).click();
  await setupFins(.1);
  await pitch(-.65);
  await panelHas('足元の部品を選ぶ');
  await capture('fins-surface');
  await chooseFin('boot','ブーツを持つ',[]);
  assert.equal(await progress(),'0');
  assert.match(await page.locator('#feedback').innerText(),/先に別の操作/);
  const firstMiss = await page.evaluate(() => JSON.parse(localStorage.getItem('dive-atlas.owd-draft.v1')).missed);
  assert.deepEqual(firstMiss,['fin-strap']);
  await use(await finPoint('fin-part-strap',[]));
  await panelHas('ストラップで何をする？','外側へよける','ストラップを持つ','フィットを確かめる');
  await capture('fins-recall-strap-options');
  const strapOption = await page.evaluate(() => window.qaPanelPoints['外側へよける']);
  await use(finsPanel(strapOption.x+22,strapOption.y));
  assert.equal(await progress(),'1');
  const boot = await finPoint('fin-foot',['fin-strap']);
  const pocket = await finPoint('pocket',['fin-strap']);
  await chooseFin('boot','ブーツを持つ',['fin-strap']);
  await panelHas('ブーツを持つ','キャンセル');
  await use(finsPanel(155,298));
  await panelHas('足元の部品を選ぶ');
  assert.equal(await progress(),'1');
  await chooseFin('boot','ブーツを持つ',['fin-strap']);
  await grab(boot,await finPoint('heel',['fin-strap']));
  assert.equal(await progress(),'1');
  assert.match(await page.locator('#feedback').innerText(),/位置が違います/);
  await chooseFin('boot','ブーツを持つ',['fin-strap']);
  await aimAt(boot);
  const beforeCarry = await capture('fins-before-carry');
  await grab(boot,pocket,async () => {
    assert(!(await capture('fins-carrying-boot')).equals(beforeCarry));
    assert.equal(await progress(),'1');
  });
  assert.equal(await progress(),'2');
  await chooseFin('strap','ストラップを持つ',bootIn);
  await use(await finPoint('fin-lock',bootIn));
  assert.equal(await progress(),'2');
  await use(await finPoint('heel',bootIn));
  assert.equal(await progress(),'3');

  await chooseFin('boot','かかとを動かす（長押し）',strapped,'loose',0,260);
  await page.waitForFunction(() => document.querySelector('#feedback').textContent.includes('もう少しかかとを動かして'));
  const wiggle = await pausedSweep();
  assert(wiggle>0&&wiggle<1);
  assert.equal(await progress(),'3');
  await capture('fins-heel-moving');
  await pitch(0);
  await use(leaveFins);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  await page.reload();
  await page.locator('#resume-practice').click();
  assert.equal(await progress(),'3');
  assert.equal(await pausedSweep(),wiggle);
  await start();
  await pitch(-.65);
  await chooseFin('boot','かかとを動かす（長押し）',strapped,'loose',wiggle,1000);
  assert.equal(await progress(),'4');
  await chooseFin('strap','フィットを確かめる',wiggled);
  await capture('fins-loose-fit');
  await use(goodFit);
  assert.equal(await progress(),'4');
  assert.match(await page.locator('#feedback').innerText(),/器材の状態をもう一度/);
  await use(looseFit);
  assert.equal(await progress(),'5');
  await capture('fins-adjusted');
  await use(leaveFins);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  const finReview = () => page.evaluate(()=>JSON.parse(localStorage.getItem('dive-atlas.owd-review.v1.fins')));
  assert.deepEqual((await finReview()).steps,['fin-strap','fin-foot','fin-check']);
  assert.equal((await finReview()).scenario,'loose');

  await page.reload();
  assert.equal((await finReview()).scenario,'loose');
  await page.getByRole('button',{name:'フィンの履き方',exact:true}).click();
  await setupFins(.9);
  await pitch(-.65);
  const readyPoint = (id,done) => finPoint(id,done,'ready');
  await chooseFin('strap','外側へよける',[],'ready');
  assert.equal(await progress(),'1');
  await chooseFin('boot','ブーツを持つ',['fin-strap'],'ready');
  await grab(await readyPoint('fin-foot',['fin-strap']),await readyPoint('pocket',['fin-strap']));
  await chooseFin('strap','ストラップを持つ',bootIn,'ready');
  await grab(await readyPoint('fin-lock',bootIn),await readyPoint('heel',bootIn));
  assert.equal(await progress(),'3');
  await chooseFin('boot','かかとを動かす（長押し）',strapped,'ready',0,1000);
  await chooseFin('strap','フィットを確かめる',wiggled,'ready');
  await capture('fins-fitted-check');
  await use(goodFit);
  assert.equal(await progress(),'5');
  await use(leaveFins);
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  assert.deepEqual((await finReview()).steps,[]);
  assert.equal((await finReview()).scenario,'ready');
  const gearPanel = (x,y) => [-.96+(x/1024-.5)*.99,1.60+.35+(.5-y/346)*.3345,-1.43];
  const leaveGear = gearPanel(892,57);
  const continueBuddy = gearPanel(766,215);
  const normalGear = gearPanel(260,215);
  const repairGear = gearPanel(766,215);
  const gearPoint = (id, done, kind='gear', scenario='seal', pressure={}) =>
    page.evaluate(async ({ id, done, kind, scenario, pressure }) => {
      const { Group, Vector3 } = await import(new URL('../vendor/three.module.js', location));
      const { lessons } = await import(new URL('lessons.js', location));
      const { makeModel } = await import(new URL('models.js', location));
      const lesson = lessons.find(item => item.id === kind);
      window.qaKit ??= new Map();
      const key = kind + ':' + scenario;
      if (!window.qaKit.has(key)) {
        const root = new Group();
        root.position.set(0, 1.60, 0);
        root.scale.setScalar(.70);
        window.qaKit.set(key, makeModel(root,lesson,scenario));
      }
      const model = window.qaKit.get(key);
      model.update(new Set(done),1,240,{pressure});
      model.sync();
      const anchor = lesson.actions.find(action => action.id === id)?.anchor || id;
      const [part, offset] = model.anchors[anchor] || model.docks[id];
      const point = offset.clone();
      point.y += model.docks[id] ? .12 : .14;
      if (id === 'buddy-vent') point.z += .17;
      return part.localToWorld(point).sub(new Vector3(0,.18,2.05)).toArray();
    }, {id,done,kind,scenario,pressure});
  const recallScenario = async sample => {
    await page.locator('#guided').click();
    await page.evaluate(value => {
      const random = Math.random;
      try {
        Math.random = () => value;
        document.querySelector('#recall').click();
      } finally { Math.random = random; }
    },sample);
  };
  const leaveBench = async () => {
    await use(leaveGear);
    await page.waitForFunction(() => window.qaEvents.includes('end'));
  };
  await page.reload();
  await recallScenario(.10);
  await start();
  await use(await gearPoint('inspect',[],'gear','expired'));
  await capture('gear-expired-date');
  await use(normalGear);
  assert.equal(await progress(),'0');
  await use(repairGear);
  assert.equal(await progress(),'1');
  await leaveBench();

  await page.reload();
  await recallScenario(.42);
  await page.evaluate(async () => {
    const { Scene } = await import(new URL('../vendor/three.module.js', location));
    const add = Scene.prototype.add;
    window.qaGearCallouts = new Map();
    Scene.prototype.add = function(...objects) {
      for (const object of objects) {
        if (/^gear-(marker|label):/.test(object.name)) window.qaGearCallouts.set(object.name,object);
      }
      return add.apply(this,objects);
    };
  });
  await start();
  const visibleGear = kind => page.evaluate(kind => [...window.qaGearCallouts.values()]
    .filter(object => object.visible && object.name.startsWith('gear-' + kind + ':'))
    .map(object => object.name.split(':')[1]),kind);
  const onlyGearLabel = id => page.waitForFunction(id => {
    const labels = [...window.qaGearCallouts.values()].filter(object => object.visible && object.name.startsWith('gear-label:'));
    return labels.length === 1 && labels[0].name === 'gear-label:' + id;
  },id);
  const initialMarkers = await visibleGear('marker');
  assert(initialMarkers.length >= 8);
  assert(initialMarkers.includes('open') && initialMarkers.includes('inspect-ring'));
  assert((await visibleGear('label')).length <= 1);
  await capture('gear-bench');
  await aimAt(await gearPoint('inspect-ring',[]));
  await onlyGearLabel('inspect-ring');
  await capture('gear-ring-label-front');
  await aimAt(await gearPoint('open',[]));
  await onlyGearLabel('open');
  await page.evaluate(() => { window.xrDevice.position.x = .23; });
  await look(-.22);
  await aimAt(await gearPoint('inspect-ring',[]));
  await onlyGearLabel('inspect-ring');
  await aimAt(await gearPoint('open',[]));
  await onlyGearLabel('open');
  await capture('gear-valve-label-angle');
  await trigger(1);
  await page.waitForTimeout(120);
  await trigger(0);
  await page.waitForFunction(() => document.querySelector('#feedback').dataset.tone === 'retry');
  assert.equal(await progress(),'0');
  await page.evaluate(() => { window.xrDevice.position.x = 0; });
  await look(0);
  const beforeGearExample = await storedDraft();
  await use(gearPanel(678,57));
  await panelHas('見本  1 / 11','シリンダーの検査期限を確認');
  await use(gearPanel(370,298));
  await panelHas('再生');
  await use(gearPanel(602,298));
  await panelHas('見本  2 / 11','Oリングを確認','再生');
  await capture('gear-example-ring-before');
  await use(gearPanel(370,298));
  await page.waitForFunction(() => window.qaPanelText.join('').includes('Oリングが欠けていないシリンダーに交換しました。'));
  await capture('gear-example-ring-replaced');
  await use(gearPanel(678,57));
  await panelHas('機材セッティング   0 / 11','見本を見る');
  assert.equal(await storedDraft(),beforeGearExample);
  await use(continueBuddy);
  assert.equal(await progress(),'0');
  assert.equal(await page.locator('#lesson-title').innerText(),'機材セッティング');
  await use(await gearPoint('stow',[]));
  assert.equal(await progress(),'0');
  assert.match(await page.locator('#feedback').innerText(),/先に別の操作/);
  await capture('gear-unassisted-candidates');
  await use(await gearPoint('inspect-ring',[]));
  assert.equal(await progress(),'0');
  assert.match(await page.locator('#feedback').innerText(),/先に別の操作/);
  await use(await gearPoint('inspect',[]));
  await capture('gear-valid-date');
  await use(normalGear);
  assert.equal(await progress(),'1');
  const gearDone = ['inspect'];
  await use(await gearPoint('inspect-ring',gearDone));
  await capture('gear-damaged-ring');
  await use(normalGear);
  assert.equal(await progress(),'1');
  await use(repairGear);
  gearDone.push('inspect-ring');
  assert.equal(await progress(),'2');
  const jacket = await gearPoint('bcd',gearDone);
  await grab(jacket,await gearPoint('valve',gearDone));
  assert.equal(await progress(),'2');
  assert.match(await page.locator('#feedback').innerText(),/位置が違います/);
  await grab(jacket,await gearPoint('cylinder',gearDone), () => capture('gear-carrying-bcd'));
  gearDone.push('bcd');
  assert.equal(await progress(),'3');
  await leaveBench();
  await page.reload();
  await page.locator('#resume-practice').click();
  assert.equal(await progress(),'3');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('dive-atlas.owd-draft.v1')).done),gearDone);
  await start();
  for (const id of ['lock','uncap']) {
    await use(await gearPoint(id,gearDone));
    gearDone.push(id);
    assert.equal(await progress(),String(gearDone.length));
  }
  await grab(await gearPoint('first',gearDone),await gearPoint('valve',gearDone));
  gearDone.push('first');
  assert.equal(await progress(),'6');
  await use(await gearPoint('connect',gearDone));
  assert.equal(await progress(),'6');
  await use(await gearPoint('inflator',gearDone));
  gearDone.push('connect');
  assert.equal(await progress(),'7');
  for (const id of ['stow','gauge-away','open']) {
    if (id === 'gauge-away') {
      await use(await gearPoint('open',gearDone));
      assert.equal(await progress(),'8');
      assert.match(await page.locator('#feedback').innerText(),/先に別の操作/);
    }
    await use(await gearPoint(id,gearDone));
    gearDone.push(id);
    assert.equal(await progress(),String(gearDone.length));
  }
  const gearBeforePressure = await page.evaluate(() => localStorage.getItem('dive-atlas.owd-draft.v1'));
  await use(await gearPoint('pressure',gearDone));
  await capture('gear-pressure-dial');
  await use(normalGear);
  assert.equal(await progress(),'11');
  await capture('gear-complete-vr');
  const readGearReview = () => page.evaluate(() => JSON.parse(localStorage.getItem('dive-atlas.owd-review.v1.gear')));
  const gearReview = await readGearReview();
  assert.equal(gearReview.scenario,'seal');
  assert.deepEqual(gearReview.steps,['inspect','inspect-ring','bcd','gauge-away']);
  await panelHas('見直す手順は4つ','見直す手順を見る','バディチェックへ ›');
  await use(gearPanel(260,215));
  await panelHas('見直し  1 / 4','シリンダーの検査期限を確認');
  await use(gearPanel(850,298));
  await panelHas('見直し  2 / 4','Oリングを確認');
  await capture('gear-review-ring');
  await use(gearPanel(678,57));
  await panelHas('見直しの見本','Oリングを確認','見直しに戻る');
  await page.waitForFunction(() => window.qaPanelText.join('').includes('Oリングが欠けていないシリンダーに交換しました。'));
  await panelHas('もう一度見る');
  await capture('gear-review-replay-replaced');
  await use(gearPanel(678,57));
  await panelHas('見直し  2 / 4','Oリングを確認');
  await use(await gearPoint('inspect-ring',['inspect']));
  await panelHas('見直し  2 / 4','Oリングを確認');
  assert.equal(await progress(),'11');
  await use(gearPanel(174,298));
  await panelHas('見直し  1 / 4');
  await use(gearPanel(850,298));
  await use(gearPanel(850,298));
  await panelHas('見直し  3 / 4','BCDを取り付ける');
  await capture('gear-review-dock');
  await use(gearPanel(678,57));
  await panelHas('見直しの見本','BCDを取り付ける','一時停止');
  const bench = { x: 490, y: 430, width: 520, height: 380 };
  const beforeBand = await page.screenshot({ clip: bench });
  await page.waitForTimeout(1130);
  const duringBand = await page.screenshot({ clip: bench });
  assert(!duringBand.equals(beforeBand), 'The attachment view changes during the BCD replay');
  await capture('gear-review-bcd-moving');
  await panelHas('見直しの見本','BCDを取り付ける','もう一度見る');
  await use(gearPanel(678,57));
  await panelHas('見直し  3 / 4','BCDを取り付ける');
  assert.equal(await progress(),'11');
  await use(gearPanel(512,298));
  await panelHas('見直す手順は4つ','バディチェックへ ›');
  assert.deepEqual(await readGearReview(),gearReview);
  await page.evaluate(() => { window.sessionBeforeBuddy = window.qaSession; window.xrDevice.position.x = .34; });
  await look(-.24);
  await use(continueBuddy);
  await page.waitForFunction(() => document.querySelector('#lesson-title').textContent === 'バディチェック');
  assert(await page.evaluate(() => window.qaSession === window.sessionBeforeBuddy && !window.qaEvents.includes('end')));
  assert.equal(await progress(),'0');
  assert.equal(await page.locator('#recall').getAttribute('aria-pressed'),'true');
  const buddyStart = await page.evaluate(async () => {
    const { readDraft } = await import(new URL('drafts.js',location));
    const { id, practice } = readDraft(localStorage);
    return { id, lesson: practice.lesson.id, index: practice.index, scenario: practice.scenario, mode: practice.mode };
  });
  assert(buddyStart.id);
  assert.equal(buddyStart.lesson,'buddy');
  assert.equal(buddyStart.index,0);
  assert.equal(buddyStart.mode,'recall');
  assert.deepEqual(await readGearReview(),gearReview);
  await page.evaluate(() => { window.xrDevice.position.x = 0; });
  await look(0);
  await capture('buddy-same-session');
  const buddyDone = [];
  const buddyPoint = id => gearPoint(id,buddyDone,'buddy',buddyStart.scenario);
  const buddyAnswer = fault => buddyStart.scenario === fault ? repairGear : normalGear;
  await use(await buddyPoint('buoyancy'),560);
  buddyDone.push('buoyancy');
  assert.equal(await progress(),'1');
  await capture('buddy-inflated');
  await leaveBench();
  await page.waitForFunction(() => document.activeElement?.id === 'vr-practice');
  await page.reload();
  await page.getByRole('button',{name:'マスククリア',exact:true}).click();
  await page.locator('#mask-fill').selectOption('mask-full');
  await page.getByRole('button',{name:'レギュレーター回収',exact:true}).click();
  await page.locator('#recovery-search').selectOption('reach');
  await page.locator('#recovery-clear').selectOption('exhale');
  await page.locator('#resume-practice').click();
  assert.equal(await page.locator('#lesson-title').innerText(),'バディチェック');
  assert.equal(await progress(),'1');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dive-atlas.owd-draft.v1')).id),buddyStart.id);
  assert.deepEqual(await readGearReview(),gearReview);
  await start();
  await use(await buddyPoint('buddy-vent'),700);
  buddyDone.push('buddy-vent');
  assert.equal(await progress(),'2');
  await use(await buddyPoint('weights'));
  await capture('buddy-weight-pocket');
  await use(buddyAnswer('weight'));
  buddyDone.push('weights');
  assert.equal(await progress(),'3');
  await use(await buddyPoint('releases'));
  await capture('buddy-buckle-check');
  await use(buddyStart.scenario === 'buckle' ? normalGear : repairGear);
  assert.equal(await progress(),'3');
  await use(buddyAnswer('buckle'));
  buddyDone.push('releases');
  assert.equal(await progress(),'4');
  await use(await buddyPoint('buddy-valve'));
  buddyDone.push('buddy-valve');
  assert.equal(await progress(),'5');
  await use(await buddyPoint('air'),1100);
  buddyDone.push('air');
  assert.equal(await progress(),'6');
  await use(await buddyPoint('alternate'));
  await use(buddyAnswer('hose'));
  buddyDone.push('alternate');
  assert.equal(await progress(),'7');
  await use(await buddyPoint('final'));
  assert.equal(await progress(),'8');
  await capture('buddy-checked');
  const readBuddyReview = () => page.evaluate(() => JSON.parse(localStorage.getItem('dive-atlas.owd-review.v1.buddy')));
  const buddyReview = await readBuddyReview();
  assert.equal(buddyReview.scenario,buddyStart.scenario);
  assert.deepEqual(buddyReview.steps,['releases']);
  await rememberSession();
  const stance = { x: .22, yaw: -.35 };
  await page.evaluate(x => { window.xrDevice.position.x = x; }, stance.x);
  await look(stance.yaw);
  await panelHas('マスククリアへ ›');
  await use(gearPanel(766,215));
  await panelHas('マスククリア   0 / 3','マスク内の水 100%');
  assert(await sameSession());
  assert.equal(await progress(),'0');
  assert.equal(await water(),100);
  const inNewStance = ([x,y,z]) => {
    const c = Math.cos(stance.yaw), s = Math.sin(stance.yaw);
    return [stance.x + c*x + s*z,y,c*z - s*x];
  };
  const maskPanel = (x,y) => inNewStance([(x/1024-.5)*.99,1.60-.33+(.5-y/346)*.3345,-1.22]);
  await capture('mask-from-buddy');
  await use(maskPanel(...breathe));
  await use(maskPanel(...seal));
  await use(maskPanel(...exhale),2250);
  assert.equal(await progress(),'3');
  await panelHas('レギュレーター回収へ ›');
  await use(maskPanel(512,215));
  await panelHas('レギュレーター回収   0 / 6','細く息を吐く');
  assert(await sameSession());
  assert.equal(await progress(),'0');
  assert.deepEqual(await readBuddyReview(),buddyReview);
  await capture('recovery-from-mask');
  await use(inNewStance(leaveRecovery));
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  await page.reload();
  await page.locator('#resume-practice').click();
  assert.equal(await page.locator('#lesson-title').innerText(),'レギュレーター回収');
  assert.equal(await progress(),'0');
  assert.equal(await page.locator('#recovery-search').inputValue(),'reach');
  assert.equal(await page.locator('#recovery-clear').inputValue(),'exhale');
  assert.equal(await page.locator('#recall').getAttribute('aria-pressed'),'true');

  // Replay the saved final gear step, then exit before doing anything in buddy check.
  await page.evaluate(saved => localStorage.setItem('dive-atlas.owd-draft.v1',saved),gearBeforePressure);
  await page.reload();
  await page.locator('#resume-practice').click();
  await start();
  await use(await gearPoint('pressure',gearDone));
  await use(normalGear);
  const gearReplayReview = await readGearReview();
  await use(continueBuddy);
  assert.equal(await progress(),'0');
  await leaveBench();
  await page.reload();
  await page.locator('#resume-practice').click();
  assert.equal(await page.locator('#lesson-title').innerText(),'バディチェック');
  assert.equal(await progress(),'0');
  assert.deepEqual(await readGearReview(),gearReplayReview);

  await page.reload();
  await page.getByRole('button',{name:'マスククリア',exact:true}).click();
  await page.locator('#recall').click();
  await start();
  const sources = await page.evaluate(() => [...window.qaSession.inputSources].map(source => ({
    hand: source.handedness, profiles: source.profiles, mapping: source.gamepad?.mapping,
    buttons: source.gamepad?.buttons.length, axes: source.gamepad?.axes.length, ray: source.targetRayMode
  })).sort((a,b) => a.hand.localeCompare(b.hand)));
  assert.deepEqual(sources.map(source => source.hand), ['left','right']);
  if (profile === 'pico-4') {
    for (const source of sources) {
      assert.deepEqual(source.profiles,['pico-4','generic-trigger-squeeze-thumbstick']);
      assert.deepEqual([source.mapping,source.buttons,source.axes,source.ray],['xr-standard',6,4,'tracked-pointer']);
    }
  }
  const squeeze = value => page.evaluate(value => window.xrDevice.controllers.left.updateButtonValue('squeeze',value),value);
  await aim(breathe,'left');
  await squeeze(1);
  await page.waitForFunction(() => [...window.qaSession.inputSources].find(source => source.handedness === 'left').gamepad.buttons[1].pressed);
  await squeeze(0);
  await page.waitForFunction(() => ![...window.qaSession.inputSources].find(source => source.handedness === 'left').gamepad.buttons[1].pressed);
  assert.equal(await progress(),'0');
  await hold(breathe,140,'left');
  assert.equal(await progress(),'1');
  await hold(seal);
  assert.equal(await progress(),'2');

  const loseTracking = hands => page.evaluate(hands => {
    window.qaMissingRays = new Set(hands.map(hand => window.xrDevice.controllers[hand].inputSource.targetRaySpace));
  },hands);
  await aim(exhale);
  await trigger(1);
  await page.waitForFunction(() => parseFloat(document.querySelector('#mask-overlay').style.getPropertyValue('--mask-water')) < 39);
  await loseTracking(['right']);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('dive-atlas.owd-draft.v1'))?.progress > 0);
  const beforeRelease = await water();
  assert(beforeRelease > 0 && beforeRelease < 39);
  assert.equal(await page.evaluate(() => window.qaSession.inputSources.length),2,'The right controller remains connected');
  await page.waitForTimeout(320);
  assert.equal(await water(),beforeRelease);
  await trigger(0);
  assert.equal(await progress(),'2');
  await page.evaluate(() => { window.xrDevice.controllers.left.connected = false; });
  await panelHas('コントローラーを確認','照準が戻ると、同じ手順を続けられます。');
  await capture('tracking-lost');
  await page.evaluate(() => { window.xrDevice.controllers.left.connected = true; });
  await panelHas('マスククリア   2 / 3','鼻から息を吐く');
  assert.equal(await water(),beforeRelease);
  const partialDraft = await storedDraft();
  await hold(exampleEntry,140,'left');
  await panelHas('見本  1 / 3','一時停止');
  await page.evaluate(() => { window.xrDevice.controllers.left.connected = false; });
  await panelHas('コントローラーを確認');
  await page.evaluate(() => { window.xrDevice.controllers.left.connected = true; });
  await panelHas('見本  1 / 3','再生');
  await hold(exampleEntry,140,'left');
  await panelHas('マスククリア   2 / 3');
  assert.equal(await storedDraft(),partialDraft);
  await hold(exhale,2250,'left');
  assert.equal(await progress(),'3');
  assert.equal(await water(),0);
  await capture('left-controller-resumed');
  await hold(exit,140,'left');
  await page.waitForFunction(()=>window.qaEvents.includes('end'));
  assert.deepEqual(errors,[]);
  await writeFile(folder+'/report.json',JSON.stringify({revision,dirty,runtime:'IWER 2.8.0, ' + (profile === 'pico-4' ? 'PICO 4 input profile' : 'Meta Quest 3 profile') + ', Chrome',profile,inputSources:sources,checks:['XR button available for gear and hidden during the example','Session denial keeps the desktop practice available','Tracked controller ray and trigger enforce step order','Press and release preserve partly cleared water','Head pose changes rendered view','In-world exit restores 2D at same step','Reload resumes exact water level','Stereo renders two eye views','System exit during a hold preserves partial progress','Reenter VR and finish','Recall saves the expected review and exiting focuses the result','Facing the hose unlocks the XR sweep and a partial hold moves the arm','Leaving XR and reloading resumes the same recovery hold','World-space selection checks the mouth dock before purge and saves mistakes','Shoulder trace and exhale complete the alternate recovery route','Spatial inflator controls expand the BCD, reject the low dock and require raising the exhaust','Partial VR venting survives leaving and reloading','Small spatial trim pulses overshoot, correct to neutral, and save mistakes','Surface fins accept a tracked drag or separate selections and reject the wrong dock','A partially lifted heel is saved across XR exit and reload','Loose and snug straps look different and require the matching judgement','Gear inspection reads dates and a damaged O-ring and rejects incorrect answers','Gear attaches BCD, first stage and low-pressure hose, preserves progress and requires the gauge to be turned before opening','Gear and buddy check share one XR session and the bench stays anchored when the viewer moves','Exiting right after handoff or mid-buddy-check restores the correct step and keeps the gear review','Buddy check exercises inflation, inspection, error correction and its own saved review','VR result shows the flagged mask step while leaving the completed run untouched','Gear review navigates missed steps with contextual equipment, then returns to the result without changing the record','VR example moves mask water, pauses and starts fresh unaided practice within the session','Opening and closing a VR example preserves an interrupted exercise and its exact saved water','Gear example shows the damaged seal and its replacement without changing the exercise','Fin recall shows equipment and unmarked candidate actions, and records an early attempt to put on the boot','Guided fins still indicate the next action, while recalled attachments can be canceled or carried to a dock','The missed mask exhale replays its full-water route and animates to empty, then returns to the same review item without changing results','A missed gear inspection replays the original damaged O-ring and its replacement in the headset','The BCD moves in the headset during its review replay, then returns to the same result','The headset exposes a hint on demand, keeps it through XR exit, and distinguishes a step that needed both retry and hint','A live session continues from a completed regulator drill to inflator, and from inflator to an operable fin scene','Buddy check, full-mask practice and the selected alternate regulator route share the session, re-anchor to the viewer, and save a zero-step draft','Either controller can select, squeeze does not select, and losing a ray during a hold preserves the exact progress for the other hand','The example pauses with neither controller tracked and closes back to the same saved practice','The mask rim accepts a direct controller ray in unaided recall and shows the sealed visor','Retrying a missed full-mask result resets the water and saves the same route in the same XR session while retaining the prior review until completion','A controller ray hits the real inflate and deflate caps during the normal drill and trim, independently of the nearby labels','Recall leaves later equipment candidates selectable and does not give away the recovery docking target','Nearby O-ring and valve targets show one distinct label at a time and remain selectable from front and angled views']},null,2));
  console.log(folder);
} catch(error) {
  console.log(JSON.stringify({errors, browser:await page.evaluate(()=>({iwer:!!window.xrDevice,events:window.qaEvents,session:!!window.qaSession,feedback:document.querySelector('#feedback')?.textContent}))}));
  await page.screenshot({path:folder+'/failed.png'}).catch(()=>{});
  throw error;
} finally { await browser.close(); }
