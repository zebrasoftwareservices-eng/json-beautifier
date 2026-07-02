import "./OutputSkeleton.css";

export function OutputSkeleton() {
  return (
    <div className="output-skeleton">
      <div className="output-skeleton__bars" aria-hidden="true">
        <div className="output-skeleton__bar output-skeleton__bar--1" />
        <div className="output-skeleton__bar output-skeleton__bar--2" />
        <div className="output-skeleton__bar output-skeleton__bar--3" />
        <div className="output-skeleton__bar output-skeleton__bar--4" />
        <div className="output-skeleton__bar output-skeleton__bar--5" />
      </div>
      <p className="output-skeleton__text">Formatted JSON appears here</p>
    </div>
  );
}
