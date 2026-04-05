import type { BodyUnitPreferences, HeightDisplayUnit, WeightDisplayUnit } from "../lib/bodyUnits";

type Props = {
  units: BodyUnitPreferences;
  onHeightChange: (u: HeightDisplayUnit) => void;
  onWeightChange: (u: WeightDisplayUnit) => void;
  labelledBy?: string;
};

export function BodyUnitToggles({
  units,
  onHeightChange,
  onWeightChange,
  labelledBy,
}: Props) {
  return (
    <div
      className="cp-body-units"
      role="group"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : "Height and weight display units"}
    >
      <div className="cp-body-units__group">
        <span className="cp-body-units__label">Height</span>
        <div className="cp-unit-toggle" role="group" aria-label="Height units">
          <button
            type="button"
            className={
              "cp-unit-toggle__btn" + (units.height === "cm" ? " cp-unit-toggle__btn--active" : "")
            }
            aria-pressed={units.height === "cm"}
            onClick={() => onHeightChange("cm")}
          >
            cm
          </button>
          <button
            type="button"
            className={
              "cp-unit-toggle__btn" +
              (units.height === "ft_in" ? " cp-unit-toggle__btn--active" : "")
            }
            aria-pressed={units.height === "ft_in"}
            onClick={() => onHeightChange("ft_in")}
          >
            ft / in
          </button>
        </div>
      </div>
      <div className="cp-body-units__group">
        <span className="cp-body-units__label">Weight</span>
        <div className="cp-unit-toggle" role="group" aria-label="Weight units">
          <button
            type="button"
            className={
              "cp-unit-toggle__btn" + (units.weight === "kg" ? " cp-unit-toggle__btn--active" : "")
            }
            aria-pressed={units.weight === "kg"}
            onClick={() => onWeightChange("kg")}
          >
            kg
          </button>
          <button
            type="button"
            className={
              "cp-unit-toggle__btn" + (units.weight === "lb" ? " cp-unit-toggle__btn--active" : "")
            }
            aria-pressed={units.weight === "lb"}
            onClick={() => onWeightChange("lb")}
          >
            lb
          </button>
        </div>
      </div>
    </div>
  );
}
