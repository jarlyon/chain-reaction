// ─────────────────────────────────────────────────────────
//  PUZZLES
//  Each word connects to the next to form a compound word.
//  e.g. WINTER+STORM, STORM+FRONT, FRONT+ROW, ROW+BOAT, BOAT+SHOE
// ─────────────────────────────────────────────────────────

const PUZZLES = [
  {
    id: "weather-footwear",
    theme: "Weather to Footwear",
    words: [
      { word: "WINTER", clue: "coldest season" },
      { word: "STORM",  clue: "thunder & lightning" },
      { word: "FRONT",  clue: "the forward face" },
      { word: "ROW",    clue: "line of seats" },
      { word: "BOAT",   clue: "floats on water" },
      { word: "SHOE",   clue: "worn on your foot" },
    ]
  },
  {
    id: "sun-stone",
    theme: "Sun to Stone",
    words: [
      { word: "SUN",   clue: "star at our center" },
      { word: "BURN",  clue: "fire's effect" },
      { word: "OUT",   clue: "not inside" },
      { word: "DOOR",  clue: "swings open" },
      { word: "STEP",  clue: "one stair" },
      { word: "STONE", clue: "solid rock" },
    ]
  },
  {
    id: "camp-walk",
    theme: "Camp to Walk",
    words: [
      { word: "CAMP",  clue: "sleep under stars" },
      { word: "FIRE",  clue: "hot and bright" },
      { word: "WORK",  clue: "do your job" },
      { word: "OUT",   clue: "not inside" },
      { word: "SIDE",  clue: "left or right" },
      { word: "WALK",  clue: "stroll on foot" },
    ]
  },
  {
    id: "black-lift",
    theme: "Black to Lift",
    words: [
      { word: "BLACK", clue: "darkest color" },
      { word: "BIRD",  clue: "feathered flyer" },
      { word: "HOUSE", clue: "place to live" },
      { word: "WORK",  clue: "effort applied" },
      { word: "SHOP",  clue: "buy things here" },
      { word: "LIFT",  clue: "raise it up" },
    ]
  },
  {
    id: "day-light",
    theme: "Day to Light",
    words: [
      { word: "DAY",     clue: "24 hours" },
      { word: "DREAM",   clue: "sleep vision" },
      { word: "LAND",    clue: "solid ground" },
      { word: "MARK",    clue: "leave a trace" },
      { word: "DOWN",    clue: "feathers or falling" },
      { word: "LIGHT",   clue: "not heavy, or bright" },
    ]
  },
  {
    id: "sea-side",
    theme: "Sea to Side",
    words: [
      { word: "SEA",    clue: "salty water" },
      { word: "SHELL",  clue: "snail's home" },
      { word: "FISH",   clue: "swims with fins" },
      { word: "BOWL",   clue: "round dish" },
      { word: "GAME",   clue: "play to win" },
      { word: "SIDE",   clue: "left or right" },
    ]
  },
  {
    id: "book-end",
    theme: "Book to End",
    words: [
      { word: "BOOK",   clue: "pages bound together" },
      { word: "CASE",   clue: "holds or contains" },
      { word: "WORK",   clue: "effort applied" },
      { word: "SHOP",   clue: "buy things here" },
      { word: "KEEPER", clue: "one who looks after" },
      { word: "END",    clue: "finish line" },
    ]
  },
  {
    id: "head-line",
    theme: "Head to Line",
    words: [
      { word: "HEAD",   clue: "atop your neck" },
      { word: "BAND",   clue: "strip or music group" },
      { word: "STAND",  clue: "upright position" },
      { word: "STILL",  clue: "motionless" },
      { word: "LIFE",   clue: "being alive" },
      { word: "LINE",   clue: "long thin mark" },
    ]
  }
];
