export default function GradingPage() {
  return (
    <section className="page">
      <h2>AI Quality Grading</h2>
      <p>
        Track 1 uses real Alba/C5 data. Track 2 is synthetic and must always be
        treated as a generalization test.
      </p>
      <form className="form">
        <div className="row">
          <input placeholder="Diameter (mm)" />
          <select defaultValue="">
            <option value="" disabled>
              Color Category
            </option>
            <option value="pale_golden_tan">Pale golden-tan</option>
            <option value="deep_yellow_golden_brown">
              Deep yellow-golden-brown
            </option>
            <option value="medium_brown_with_patches">
              Medium brown with patches
            </option>
            <option value="rough_dark_brown">Rough dark brown</option>
          </select>
          <select defaultValue="">
            <option value="" disabled>
              Texture/Foxing
            </option>
            <option value="immaculate">Immaculate</option>
            <option value="very_clean_under_15_percent_spots">
              Very clean under 15%
            </option>
            <option value="moderately_patchy_40_to_60_percent">
              Moderately patchy 40-60%
            </option>
            <option value="rough_heavily_discoloured">
              Rough/heavily discoloured
            </option>
          </select>
        </div>
        <button type="button">Predict Grade</button>
      </form>
    </section>
  );
}
