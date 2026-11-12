const boxes = {
  title_arknights: '0 0 254 119', logo_rhodes_island: '0 0 459.1 374.4',
  copyright_mini: '0 0 166 18', icon_sound: '0 0 30 34', icon_voice: '0 0 44 44',
  icon_arrow: '0 0 7 15', icon_dblArrow: '0 0 13 11',
  icon_arrow_hrz: '0 0 40 7.5', icon_play_btn: '0 0 34.1 32.1', icon_mini_play_btn: '0 0 44 42',
  elite_phase_0: '0 0 128 78', elite_phase_1: '0 0 127.7 77.9', elite_phase_2: '0 0 127.7 103.7',
};

export function Icon({ name, className = '', reverse = false, rotation = 0 }) {
  return <svg aria-hidden="true" className={className} viewBox={boxes[name]} style={reverse || rotation ? { transform: `rotate(${reverse ? 180 : rotation}deg)` } : undefined}>
    <use href={`/assets/images/icons.svg#svg_def-${name}`} />
  </svg>;
}
