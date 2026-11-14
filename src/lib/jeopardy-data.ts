export interface Question {
  question: string;
  answer: string;
  value?: number;
  type?: "normal" | "order" | "hint" | "choice";
  options?: string[];
  correctOption?: number;
  orderItems?: string[];
  hints?: string[];
  imageUrl?: string;
  videoUrl?: string;
}

export interface Category {
  name: string;
  questions: Question[]; // Länge 5, sortiert nach Punktwerten 100..1000
}

export const POINT_VALUES = [100, 200, 400, 600, 1000] as const;

export const CATEGORIES: Category[] = [
  {
    name: "Hauptstädte",
    questions: [
      { question: "Hauptstadt von Frankreich", answer: "Paris" },
      { question: "Hauptstadt von Japan", answer: "Tokio" },
      { question: "Hauptstadt von Australien", answer: "Canberra" },
      { question: "Hauptstadt von Kenia", answer: "Nairobi" },
      { question: "Hauptstadt von Bhutan", answer: "Thimphu" },
    ],
  },
  {
    name: "Wissenschaft",
    questions: [
      { question: "Chemische Formel für Wasser", answer: "H2O" },
      { question: "Planet, bekannt als der Rote Planet", answer: "Mars" },
      { question: "Kraft, die Dinge zur Erde zieht", answer: "Schwerkraft" },
      { question: "Kraftwerk der Zelle", answer: "Mitochondrium" },
      { question: "Ungeladenes Teilchen im Atomkern", answer: "Neutron" },
    ],
  },
  {
    name: "Filme",
    questions: [
      { question: "Regisseur von 'Jurassic Park' (1993)", answer: "Steven Spielberg" },
      { question: "Zauberschule in Harry Potter", answer: "Hogwarts" },
      { question: "Erscheinungsjahr des ersten 'Star Wars'-Films", answer: "1977" },
      { question: "Schauspieler, der den Joker in 'The Dark Knight' spielte", answer: "Heath Ledger" },
      { question: "Erfolgreichster Film aller Zeiten (2024)", answer: "Avatar" },
    ],
  },
  {
    name: "Geschichte",
    questions: [
      { question: "Jahr, in dem der Zweite Weltkrieg endete", answer: "1945" },
      { question: "Erster Bundeskanzler der Bundesrepublik Deutschland", answer: "Konrad Adenauer" },
      { question: "Antikes Weltwunder in Gizeh", answer: "Die Große Pyramide" },
      { question: "Reich, das Julius Caesar regierte", answer: "Das Römische Reich" },
      { question: "Jahr des Mauerfalls in Berlin", answer: "1989" },
    ],
  },
  {
    name: "Sport",
    questions: [
      { question: "Anzahl Spieler einer Fußballmannschaft auf dem Feld", answer: "11" },
      { question: "Sport, der in Wimbledon gespielt wird", answer: "Tennis" },
      { question: "Land, in dem Judo erfunden wurde", answer: "Japan" },
      { question: "Olympia-Stadt 2016", answer: "Rio de Janeiro" },
      { question: "Deutscher Formel-1-Fahrer mit sieben WM-Titeln", answer: "Michael Schumacher" },
    ],
  },
  {
    name: "Musik",
    questions: [
      { question: "Band, die 'Hey Jude' sang", answer: "The Beatles" },
      { question: "Instrument mit 88 Tasten", answer: "Klavier" },
      { question: "Komponist der 'Vier Jahreszeiten'", answer: "Vivaldi" },
      { question: "Musikrichtung, die in den 1970ern in der Bronx entstand", answer: "Hip-Hop" },
      { question: "Sängerin von 'Rolling in the Deep'", answer: "Adele" },
    ],
  },
  {
    name: "Essen & Trinken",
    questions: [
      { question: "Hauptzutat von Guacamole", answer: "Avocado" },
      { question: "Land, in dem Sushi seinen Ursprung hat", answer: "Japan" },
      { question: "Gewürz aus der Krokusblüte", answer: "Safran" },
      { question: "Käse auf einer klassischen Pizza Margherita", answer: "Mozzarella" },
      { question: "Spirituose, die Basis eines Negroni ist", answer: "Gin" },
    ],
  },
  {
    name: "Technik",
    questions: [
      { question: "Mitgründer von Microsoft", answer: "Bill Gates" },
      { question: "Sprache, mit der Webseiten gestaltet werden", answer: "CSS" },
      { question: "Jahr der ersten iPhone-Veröffentlichung", answer: "2007" },
      { question: "Firma, die die GeForce-Grafikkarten herstellt", answer: "Nvidia" },
      { question: "Protokoll, auf dem das Web basiert", answer: "HTTP" },
    ],
  },
  {
    name: "Literatur",
    questions: [
      { question: "Autor von '1984'", answer: "George Orwell" },
      { question: "Zauberlehrling von J.K. Rowling", answer: "Harry Potter" },
      { question: "Dichter von 'Faust'", answer: "Goethe" },
      { question: "Russischer Autor von 'Krieg und Frieden'", answer: "Leo Tolstoi" },
      { question: "Roman, der mit 'Nennt mich Ismael' beginnt", answer: "Moby Dick" },
    ],
  },
  {
    name: "Geografie",
    questions: [
      { question: "Längster Fluss der Welt", answer: "Der Nil" },
      { question: "Kontinent, auf dem die Sahara liegt", answer: "Afrika" },
      { question: "Größtes Land der Welt nach Fläche", answer: "Russland" },
      { question: "Gebirge, das Europa und Asien trennt", answer: "Der Ural" },
      { question: "Tiefster Ozeangraben", answer: "Marianengraben" },
    ],
  },
];

export const MIN_CATEGORIES = 1;
export const MAX_CATEGORIES = 10;

export function hasValidChoices(question: Question): boolean {
  return question.type === "choice" &&
    Array.isArray(question.options) && question.options.length === 4 &&
    question.options.every((option) => typeof option === "string" && option.trim().length > 0) &&
    Number.isInteger(question.correctOption) &&
    question.correctOption! >= 0 && question.correctOption! < 4;
}

export { playerColor } from "./player-preferences";
export interface QuestionResult {
  question: Question;
  category: string;
  value: number;
  playerIndex: number | null;
  correct: boolean;
  selectedChoice?: number | null;
}
