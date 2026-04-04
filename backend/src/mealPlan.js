function concernFromRating(r) {
  return typeof r === "number" && r >= 3;
}

/**
 * @param {import('./profileDefaults.js').HealthProfile} profile
 */
export function buildDailyMealPlan(profile) {
  const concerns = [];
  if (concernFromRating(profile.sleepRating)) concerns.push("sleep_recovery");
  if (concernFromRating(profile.cognitiveRating)) concerns.push("cognitive");
  if (concernFromRating(profile.digestiveRating)) concerns.push("digestive");
  if (concernFromRating(profile.musculoskeletalRating)) concerns.push("musculoskeletal");
  if (concernFromRating(profile.immuneRating)) concerns.push("immune");

  const bmiNote =
    profile.bmi != null
      ? profile.bmi < 18.5
        ? "BMI suggests underweight—prioritize nutrient-dense snacks; discuss with a clinician if unintended."
        : profile.bmi >= 25
          ? "BMI in higher range—favor high-fiber plates and portion awareness; individualized goals belong with your care team."
          : "BMI in a common range—focus on variety and consistency."
      : "Add height and weight to personalize energy needs.";

  const breakfast = pickBreakfast(concerns);
  const lunch = pickLunch(concerns);
  const dinner = pickDinner(concerns);
  const snacks = pickSnacks(concerns);

  return {
    date: new Date().toISOString().slice(0, 10),
    summary: bmiNote,
    concerns,
    meals: {
      breakfast,
      lunch,
      dinner,
      snacks,
    },
    hydration: "Aim for water across the day; limit sugary drinks.",
    disclaimer: "Educational meal ideas only—not medical nutrition therapy.",
  };
}

/** @param {string[]} concerns */
function pickBreakfast(concerns) {
  if (concerns.includes("digestive"))
    return "Oatmeal cooked in water, sliced banana, small spoon of peanut butter; ginger tea.";
  if (concerns.includes("cognitive"))
    return "Greek yogurt, berries, walnuts, and a slice of whole-grain toast.";
  if (concerns.includes("sleep_recovery"))
    return "Whole-grain toast + egg; side of kiwi or tart cherry juice (small glass) if tolerated.";
  return "Veggie omelet or tofu scramble, whole-grain tortilla, citrus fruit.";
}

/** @param {string[]} concerns */
function pickLunch(concerns) {
  if (concerns.includes("musculoskeletal"))
    return "Mediterranean bowl: quinoa, chickpeas, cucumber, tomato, olive oil, grilled chicken or tofu.";
  if (concerns.includes("immune"))
    return "Lentil soup, mixed greens salad with peppers, olive oil vinaigrette, orange wedges.";
  return "Large salad with beans or salmon, whole-grain roll, olive oil dressing.";
}

/** @param {string[]} concerns */
function pickDinner(concerns) {
  if (concerns.includes("sleep_recovery"))
    return "Baked salmon or tempeh, roasted sweet potato, steamed broccoli—finish dinner 2–3h before bed.";
  if (concerns.includes("digestive"))
    return "Grilled chicken or fish, white rice or potatoes, well-cooked carrots and zucchini.";
  return "Stir-fry: mixed vegetables, tofu or lean beef, brown rice; light on added salt.";
}

/** @param {string[]} concerns */
function pickSnacks(concerns) {
  if (concerns.includes("cognitive"))
    return ["Apple + almond butter", "Edamame (unsalted)"];
  if (concerns.includes("immune"))
    return ["Greek yogurt + berries", "Handful of mixed nuts"];
  return ["Hummus + cucumber", "Pear + cheese (if tolerated)"];
}
