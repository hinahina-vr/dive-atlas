export function createJournalMusic(showError) {
 let clips = [];
 let audio;
 let previousClip;

 // Load both clips while the map opens. Playback still needs a click.
 const ready = fetch('./journal-bgm.json').then(async response => {
  if (!response.ok) return false;
  const tracks = await response.json();
  const loaded = await Promise.all(tracks.map(async ({file}) => {
   try {
    const sound = await fetch('./assets/journal-bgm/' + encodeURIComponent(file));
    return sound.ok ? URL.createObjectURL(await sound.blob()) : null;
   } catch {
    return null;
   }
  }));
  clips = loaded.filter(Boolean);
  return clips.length > 0;
 }).catch(() => false);

 function stop() {
  if (!audio) return;
  audio.onended = null;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  audio = undefined;
 }

 function playClip(player) {
  const choices = clips.length === 1 ? clips : clips.filter(clip => clip !== previousClip);
  const clip = choices[Math.floor(Math.random() * choices.length)];
  previousClip = clip;
  player.src = clip;
  player.play().catch(() => {
   if (audio !== player) return;
   stop();
   showError('BGMを再生できませんでした。');
  });
 }

 function start() {
  if (!clips.length) return;
  stop();
  previousClip = undefined;
  const player = new Audio();
  player.volume = .35;
  player.onended = () => playClip(player);
  audio = player;
  playClip(player);
 }

 return {ready, start, stop};
}
