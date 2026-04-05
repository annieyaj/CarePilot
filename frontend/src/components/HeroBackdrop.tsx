/** Animated mesh + soft orbs — shared by home and quick-check for one visual theme. */
export function HeroBackdrop() {
  return (
    <div className="cp-landing__bg" aria-hidden>
      <div className="cp-landing__gradient" />
      <span className="cp-landing__orb cp-landing__orb--1" />
      <span className="cp-landing__orb cp-landing__orb--2" />
      <span className="cp-landing__orb cp-landing__orb--3" />
    </div>
  );
}
