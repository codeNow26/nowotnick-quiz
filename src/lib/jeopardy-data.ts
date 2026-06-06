export interface Question {
  question: string;
  answer: string;
}

export interface Category {
  name: string;
  questions: Question[]; // length 5, in order of point value 100..1000
}

export const POINT_VALUES = [100, 200, 400, 600, 1000] as const;

export const CATEGORIES: Category[] = [
  {
    name: "World Capitals",
    questions: [
      { question: "Capital of France", answer: "Paris" },
      { question: "Capital of Japan", answer: "Tokyo" },
      { question: "Capital of Australia", answer: "Canberra" },
      { question: "Capital of Kenya", answer: "Nairobi" },
      { question: "Capital of Bhutan", answer: "Thimphu" },
    ],
  },
  {
    name: "Science",
    questions: [
      { question: "H2O is the chemical formula for this", answer: "Water" },
      { question: "Planet known as the Red Planet", answer: "Mars" },
      { question: "Force that pulls objects toward Earth", answer: "Gravity" },
      { question: "Powerhouse of the cell", answer: "Mitochondria" },
      { question: "Particle with no electric charge in the atom's nucleus", answer: "Neutron" },
    ],
  },
  {
    name: "Movies",
    questions: [
      { question: "Director of 'Jurassic Park' (1993)", answer: "Steven Spielberg" },
      { question: "Wizarding school in Harry Potter", answer: "Hogwarts" },
      { question: "Year the first 'Star Wars' film was released", answer: "1977" },
      { question: "Actor who played the Joker in 'The Dark Knight'", answer: "Heath Ledger" },
      { question: "Highest-grossing film of all time (2024)", answer: "Avatar" },
    ],
  },
  {
    name: "History",
    questions: [
      { question: "Year WWII ended", answer: "1945" },
      { question: "First president of the United States", answer: "George Washington" },
      { question: "Ancient wonder located in Giza", answer: "The Great Pyramid" },
      { question: "Empire ruled by Julius Caesar", answer: "The Roman Empire" },
      { question: "Year the Berlin Wall fell", answer: "1989" },
    ],
  },
  {
    name: "Sports",
    questions: [
      { question: "Number of players on a soccer team on the field", answer: "11" },
      { question: "Sport played at Wimbledon", answer: "Tennis" },
      { question: "Country that invented judo", answer: "Japan" },
      { question: "Olympic city in 2016", answer: "Rio de Janeiro" },
      { question: "Only golfer to win the Masters six times", answer: "Jack Nicklaus" },
    ],
  },
  {
    name: "Music",
    questions: [
      { question: "Band that sang 'Hey Jude'", answer: "The Beatles" },
      { question: "Instrument with 88 keys", answer: "Piano" },
      { question: "Composer of 'The Four Seasons'", answer: "Vivaldi" },
      { question: "Genre originating in 1970s New York and the Bronx", answer: "Hip Hop" },
      { question: "Singer of 'Rolling in the Deep'", answer: "Adele" },
    ],
  },
];
