import { FormEvent, useState } from "react";

import {
  predictGrading,
  type GradingPredictionResponse,
} from "../components/api-client";

const GRADE_DISPLAY: Record<string, string> = {
  alba: "Alba",
  c5_ex_sp: "C5 Extra Special",
  c5_sp: "C5 Special",
  c5: "C5",
  c4: "C4",
  mexico: "Mexico",
  hamburg: "Hamburg",
  Alba: "Alba",
  C5: "C5",
  C4: "C4",
  Mexico: "Mexico",
  Hamburg: "Hamburg",
};

export default function GradingPage() {
  const [diameter, setDiameter] = useState("");
  const [colorCategory, setColorCategory] = useState("pale_golden_tan");
  const [textureCategory, setTextureCategory] = useState("immaculate");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GradingPredictionResponse | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const data = await predictGrading({
        diameterMm: Number(diameter),
        colorCategory,
        textureCategory,
      });
      setResult(data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Prediction request failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <h2>AI Quality Grading</h2>
      <p>
        Track 1 uses real Alba/C5 data. Track 2 is synthetic and must always be
        treated as a generalization test.
      </p>
      {error ? <p className="status-error">{error}</p> : null}
      <form className="form" onSubmit={onSubmit}>
        <div className="row">
          <input
            placeholder="Diameter (mm)"
            type="number"
            step="0.01"
            min="0"
            value={diameter}
            onChange={(event) => setDiameter(event.target.value)}
            required
          />
          <select
            value={colorCategory}
            onChange={(event) => setColorCategory(event.target.value)}
          >
            <option value="pale_golden_tan">
              Bright pale gold (Alba-type)
            </option>
            <option value="deep_yellow_golden_brown">
              Yellow-golden brown (C5-type)
            </option>
            <option value="medium_brown_with_patches">
              Medium brown with patches (C4-type)
            </option>
            <option value="rough_dark_brown">
              Dark rough brown (Hamburg-type)
            </option>
          </select>
          <select
            value={textureCategory}
            onChange={(event) => setTextureCategory(event.target.value)}
          >
            <option value="immaculate">Immaculate - no spots at all</option>
            <option value="very_clean_under_15_percent_spots">
              Very clean - faint specks only
            </option>
            <option value="moderately_patchy_40_to_60_percent">
              Patchy - noticeable brown spots
            </option>
            <option value="rough_heavily_discoloured">
              Rough - heavy dark patches
            </option>
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Predicting..." : "Predict Grade"}
        </button>
      </form>
      {result ? (
        <div className="metric">
          <h3>Prediction Result</h3>
          <p>
            Predicted Grade:{" "}
            <strong>
              {GRADE_DISPLAY[result.predicted_grade] ?? result.predicted_grade}
            </strong>
          </p>
          <pre className="metric">{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}
