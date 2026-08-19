"""
grading_validation.py
=====================
Validation and encoding logic for the Canela Ceylon cinnamon grading module.

Scope: Alba to C4 only (ISO 6539 / SLS 81:2021)
Authority: ISO 6539:2014, SLS 81:2021, Cinnamon Quality Control Act 1969

This module is used by:
- FastAPI grading endpoint (before calling the classifier)
- Frontend validation hints (copy diameter rules to TypeScript)
"""

# Diameter boundaries (ISO 6539 / SLS 81:2021)
DIAMETER_MIN_MM = 6.0
DIAMETER_MAX_MM = 18.0

# Expected diameter ranges per grade (reference/UI hints only)
GRADE_DIAMETER_RANGES = {
    "alba": (6.0, 6.0),
    "c5_ex_sp": (6.01, 10.0),
    "c5_sp": (10.01, 12.0),
    "c5": (12.01, 14.0),
    "c4": (14.01, 18.0),
}

# Colour encoding
COLOUR_SCORE_MAP = {
    "pale_golden_tan": 1,
    "deep_yellow_golden_brown": 2,
    "medium_brown_with_patches": 3,
    "rough_dark_brown": 4,
}

# Texture / foxing encoding
TEXTURE_SCORE_MAP = {
    "immaculate": 1,
    "very_clean_under_15_percent_spots": 2,
    "moderately_patchy_40_to_60_percent": 3,
    "rough_heavily_discoloured": 4,
}

GRADE_DISPLAY = {
    "alba": "Alba",
    "c5_ex_sp": "C5 Extra Special",
    "c5_sp": "C5 Special",
    "c5": "C5",
    "c4": "C4",
}


def validate_and_encode(
    diameter_mm: float,
    colour_value: str,
    texture_value: str,
) -> dict:
    """
    Validate inputs and encode to model features.

    Returns:
    {
      "valid": bool,
      "error": str | None,
      "features": [float, int, int] | None,
    }
    """
    errors: list[str] = []

    if diameter_mm < DIAMETER_MIN_MM:
        errors.append(
            f"Diameter {diameter_mm}mm is below the minimum recognised grade "
            f"size of {DIAMETER_MIN_MM}mm (ISO 6539 / SLS 81:2021). "
            f"This quill does not meet any standard Ceylon cinnamon grade."
        )
    elif diameter_mm > DIAMETER_MAX_MM:
        errors.append(
            f"Diameter {diameter_mm}mm exceeds the maximum grade handled by "
            f"Canela Ceylon ({DIAMETER_MAX_MM}mm). Hamburg grades are outside "
            f"this system scope."
        )

    if colour_value not in COLOUR_SCORE_MAP:
        errors.append(
            f"Unrecognised colour value '{colour_value}'. "
            f"Valid options: {list(COLOUR_SCORE_MAP.keys())}"
        )

    if texture_value not in TEXTURE_SCORE_MAP:
        errors.append(
            f"Unrecognised texture value '{texture_value}'. "
            f"Valid options: {list(TEXTURE_SCORE_MAP.keys())}"
        )

    if errors:
        return {"valid": False, "error": " | ".join(errors), "features": None}

    features = [
        diameter_mm,
        COLOUR_SCORE_MAP[colour_value],
        TEXTURE_SCORE_MAP[texture_value],
    ]

    return {"valid": True, "error": None, "features": features}


if __name__ == "__main__":
    cases = [
        (5.9, "pale_golden_tan", "immaculate", False, "below 6mm - reject"),
        (6.0, "pale_golden_tan", "immaculate", True, "Alba - valid"),
        (9.5, "pale_golden_tan", "very_clean_under_15_percent_spots", True, "C5 Ex Sp - valid"),
        (13.2, "deep_yellow_golden_brown", "very_clean_under_15_percent_spots", True, "C5 - valid"),
        (17.8, "medium_brown_with_patches", "moderately_patchy_40_to_60_percent", True, "C4 - valid"),
        (18.1, "medium_brown_with_patches", "rough_heavily_discoloured", False, "above 18mm - reject"),
        (23.0, "rough_dark_brown", "rough_heavily_discoloured", False, "Hamburg - reject"),
    ]

    print(f"{'NOTE':<40} {'VALID':<8} FEATURES_OR_ERROR")
    print("-" * 100)
    for diam, col, tex, expected_valid, note in cases:
        result = validate_and_encode(diam, col, tex)
        status = "PASS" if result["valid"] == expected_valid else "FAIL"
        output = str(result["features"]) if result["valid"] else result["error"]
        print(f"{note:<40} {status:<8} {output}")
