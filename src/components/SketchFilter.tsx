// Shared SVG filter for the hand-drawn look: noise displaces strokes so straight lines wobble.
// Apply with `filter: url(#sketch)` on decoration only (borders, grid lines), never on text.
function SketchFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <filter id="sketch" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}

export default SketchFilter
