import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { S as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { R as Root$1 } from "../_libs/radix-ui__react-label.mjs";
import { R as Root, P as Portal, C as Content, a as Close, O as Overlay, T as Title, D as Description } from "../_libs/radix-ui__react-dialog.mjs";
import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
import { P as Pencil, C as Crown, D as Dices, a as ChartColumn, A as ArrowLeft, R as RotateCcw, V as VolumeX, M as Music, S as SlidersHorizontal, T as Trophy, b as Target, H as Hand, c as TrendingUp, d as TrendingDown, e as Check, X, f as Timer, E as Eye } from "../_libs/lucide-react.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = reactExports.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const Input = reactExports.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Root$1, { ref, className: cn(labelVariants(), className), ...props }));
Label.displayName = Root$1.displayName;
function StartScreen({
  title,
  subtitle,
  maxCategories,
  activeQuiz,
  onQuizChange,
  onStart
}) {
  const [count, setCount] = reactExports.useState(2);
  const [names, setNames] = reactExports.useState(["", "", "", ""]);
  const defaultCats = Math.min(6, maxCategories);
  const [catCount, setCatCount] = reactExports.useState(defaultCats);
  const updateName = (i, v) => {
    const next = [...names];
    next[i] = v;
    setNames(next);
  };
  const handleStart = () => {
    const final = names.slice(0, count).map((n, i) => n.trim() || `Spieler ${i + 1}`);
    onStart(final, Math.min(catCount, maxCategories));
  };
  const catOptions = Array.from(
    { length: maxCategories },
    (_, i) => i + 1
  );
  const pillBase = "rounded-xl font-display transition-all duration-200 border";
  const pillIdle = "glass text-foreground/80 hover:text-foreground hover:bg-white/10";
  const pillActive = "bg-primary text-primary-foreground border-transparent scale-105 shadow-[0_0_30px_-5px_var(--indigo-glow)]";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-2xl text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "h1",
      {
        className: "font-display text-5xl md:text-7xl text-foreground tracking-tight mb-3 uppercase",
        style: {
          textShadow: "0 0 40px oklch(0.55 0.24 278 / 0.6)"
        },
        children: title
      }
    ),
    subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-base md:text-lg mb-8 tracking-wide", children: subtitle }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-strong rounded-3xl p-6 md:p-8 glow-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-7", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block", children: "Quiz auswählen" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: [1, 2, 3, 4].map((quiz) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => onQuizChange(quiz),
            className: `${pillBase} h-12 text-sm ${activeQuiz === quiz ? pillActive : pillIdle}`,
            children: [
              "Quiz ",
              quiz
            ]
          },
          quiz
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block", children: "Anzahl der Spieler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 justify-center", children: [1, 2, 3, 4].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setCount(n),
            className: `${pillBase} w-14 h-14 text-2xl ${count === n ? pillActive : pillIdle}`,
            children: n
          },
          n
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs uppercase tracking-[0.2em] mb-3 block", children: "Anzahl der Kategorien" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 justify-center", children: catOptions.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setCatCount(n),
            className: `${pillBase} w-11 h-11 text-base ${catCount === n ? pillActive : pillIdle}`,
            children: n
          },
          n
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 mb-8", children: Array.from({ length: count }).map(
        (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Label,
            {
              htmlFor: `p${i}`,
              className: "text-xs text-muted-foreground uppercase tracking-[0.18em]",
              children: [
                "Spieler ",
                i + 1
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: `p${i}`,
              value: names[i],
              onChange: (e) => updateName(i, e.target.value),
              placeholder: `Spieler ${i + 1}`,
              className: "glass border-white/10 text-foreground placeholder:text-muted-foreground/60 mt-1 h-11 rounded-xl"
            }
          )
        ] }, i)
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: handleStart,
          size: "lg",
          className: "w-full font-display text-xl md:text-2xl py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider uppercase glow-primary border-0",
          children: "Spiel starten"
        }
      )
    ] })
  ] }) });
}
const POINT_VALUES = [100, 200, 400, 600, 1e3];
const CATEGORIES = [
  {
    name: "Hauptstädte",
    questions: [
      { question: "Hauptstadt von Frankreich", answer: "Paris" },
      { question: "Hauptstadt von Japan", answer: "Tokio" },
      { question: "Hauptstadt von Australien", answer: "Canberra" },
      { question: "Hauptstadt von Kenia", answer: "Nairobi" },
      { question: "Hauptstadt von Bhutan", answer: "Thimphu" }
    ]
  },
  {
    name: "Wissenschaft",
    questions: [
      { question: "Chemische Formel für Wasser", answer: "H2O" },
      { question: "Planet, bekannt als der Rote Planet", answer: "Mars" },
      { question: "Kraft, die Dinge zur Erde zieht", answer: "Schwerkraft" },
      { question: "Kraftwerk der Zelle", answer: "Mitochondrium" },
      { question: "Ungeladenes Teilchen im Atomkern", answer: "Neutron" }
    ]
  },
  {
    name: "Filme",
    questions: [
      { question: "Regisseur von 'Jurassic Park' (1993)", answer: "Steven Spielberg" },
      { question: "Zauberschule in Harry Potter", answer: "Hogwarts" },
      { question: "Erscheinungsjahr des ersten 'Star Wars'-Films", answer: "1977" },
      { question: "Schauspieler, der den Joker in 'The Dark Knight' spielte", answer: "Heath Ledger" },
      { question: "Erfolgreichster Film aller Zeiten (2024)", answer: "Avatar" }
    ]
  },
  {
    name: "Geschichte",
    questions: [
      { question: "Jahr, in dem der Zweite Weltkrieg endete", answer: "1945" },
      { question: "Erster Bundeskanzler der Bundesrepublik Deutschland", answer: "Konrad Adenauer" },
      { question: "Antikes Weltwunder in Gizeh", answer: "Die Große Pyramide" },
      { question: "Reich, das Julius Caesar regierte", answer: "Das Römische Reich" },
      { question: "Jahr des Mauerfalls in Berlin", answer: "1989" }
    ]
  },
  {
    name: "Sport",
    questions: [
      { question: "Anzahl Spieler einer Fußballmannschaft auf dem Feld", answer: "11" },
      { question: "Sport, der in Wimbledon gespielt wird", answer: "Tennis" },
      { question: "Land, in dem Judo erfunden wurde", answer: "Japan" },
      { question: "Olympia-Stadt 2016", answer: "Rio de Janeiro" },
      { question: "Deutscher Formel-1-Fahrer mit sieben WM-Titeln", answer: "Michael Schumacher" }
    ]
  },
  {
    name: "Musik",
    questions: [
      { question: "Band, die 'Hey Jude' sang", answer: "The Beatles" },
      { question: "Instrument mit 88 Tasten", answer: "Klavier" },
      { question: "Komponist der 'Vier Jahreszeiten'", answer: "Vivaldi" },
      { question: "Musikrichtung, die in den 1970ern in der Bronx entstand", answer: "Hip-Hop" },
      { question: "Sängerin von 'Rolling in the Deep'", answer: "Adele" }
    ]
  },
  {
    name: "Essen & Trinken",
    questions: [
      { question: "Hauptzutat von Guacamole", answer: "Avocado" },
      { question: "Land, in dem Sushi seinen Ursprung hat", answer: "Japan" },
      { question: "Gewürz aus der Krokusblüte", answer: "Safran" },
      { question: "Käse auf einer klassischen Pizza Margherita", answer: "Mozzarella" },
      { question: "Spirituose, die Basis eines Negroni ist", answer: "Gin" }
    ]
  },
  {
    name: "Technik",
    questions: [
      { question: "Mitgründer von Microsoft", answer: "Bill Gates" },
      { question: "Sprache, mit der Webseiten gestaltet werden", answer: "CSS" },
      { question: "Jahr der ersten iPhone-Veröffentlichung", answer: "2007" },
      { question: "Firma, die die GeForce-Grafikkarten herstellt", answer: "Nvidia" },
      { question: "Protokoll, auf dem das Web basiert", answer: "HTTP" }
    ]
  },
  {
    name: "Literatur",
    questions: [
      { question: "Autor von '1984'", answer: "George Orwell" },
      { question: "Zauberlehrling von J.K. Rowling", answer: "Harry Potter" },
      { question: "Dichter von 'Faust'", answer: "Goethe" },
      { question: "Russischer Autor von 'Krieg und Frieden'", answer: "Leo Tolstoi" },
      { question: "Roman, der mit 'Nennt mich Ismael' beginnt", answer: "Moby Dick" }
    ]
  },
  {
    name: "Geografie",
    questions: [
      { question: "Längster Fluss der Welt", answer: "Der Nil" },
      { question: "Kontinent, auf dem die Sahara liegt", answer: "Afrika" },
      { question: "Größtes Land der Welt nach Fläche", answer: "Russland" },
      { question: "Gebirge, das Europa und Asien trennt", answer: "Der Ural" },
      { question: "Tiefster Ozeangraben", answer: "Marianengraben" }
    ]
  }
];
function Board({
  categories,
  answered,
  onSelect,
  highlightedQuestion = null,
  isRandomizing = false
}) {
  const cols = categories.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "grid gap-2 md:gap-3",
      style: {
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
      },
      children: [
        categories.map((cat, categoryIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "\r\n            relative overflow-hidden\r\n            rounded-2xl\r\n            min-h-16 md:min-h-24\r\n            px-2 md:px-4\r\n            flex items-center justify-center\r\n            text-center\r\n            border border-primary/20\r\n            bg-gradient-to-b\r\n            from-primary/10\r\n            via-primary/[0.06]\r\n            to-black/10\r\n            shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]\r\n          ",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "\r\n              absolute inset-x-4 top-0\r\n              h-px\r\n              bg-gradient-to-r\r\n              from-transparent\r\n              via-primary/50\r\n              to-transparent\r\n            "
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "\r\n              absolute\r\n              -top-12 left-1/2\r\n              h-24 w-32\r\n              -translate-x-1/2\r\n              rounded-full\r\n              bg-primary/10\r\n              blur-3xl\r\n              pointer-events-none\r\n            "
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: "\r\n              relative z-10\r\n              font-display\r\n              text-[10px] sm:text-xs md:text-base\r\n              uppercase\r\n              tracking-[0.08em] md:tracking-[0.12em]\r\n              leading-tight\r\n              text-foreground\r\n              drop-shadow-sm\r\n            ",
                  children: cat.name
                }
              )
            ]
          },
          `${cat.name}-${categoryIndex}`
        )),
        POINT_VALUES.map(
          (value, qIdx) => categories.map((cat, cIdx) => {
            const done = answered[cIdx][qIdx];
            const highlighted = highlightedQuestion?.category === cIdx && highlightedQuestion?.question === qIdx;
            const displayValue = cat.questions[qIdx]?.value ?? value;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => !done && !isRandomizing && onSelect(cIdx, qIdx),
                disabled: done || isRandomizing,
                className: `
                group
                relative
                overflow-hidden
                min-h-16 md:min-h-24
                rounded-2xl
                border
                font-display
                transition-all
                duration-200
                ease-out

                ${done ? `
                      border-white/[0.03]
                      bg-white/[0.025]
                      opacity-25
                      cursor-not-allowed
                    ` : highlighted ? `
                        z-20
                        scale-[1.07]
                        border-primary/80
                        bg-gradient-to-br
                        from-primary
                        via-primary/90
                        to-violet-700
                        text-primary-foreground
                        shadow-[0_0_20px_rgba(99,102,241,0.55),0_0_55px_rgba(99,102,241,0.35)]
                      ` : isRandomizing ? `
                          border-white/[0.07]
                          bg-gradient-to-br
                          from-white/[0.07]
                          via-primary/[0.06]
                          to-primary/[0.10]
                          text-foreground
                          opacity-65
                          cursor-wait
                        ` : `
                          border-white/[0.08]
                          bg-gradient-to-br
                          from-white/[0.08]
                          via-primary/[0.07]
                          to-primary/[0.12]
                          text-foreground
                          shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
                          hover:z-10
                          hover:-translate-y-1
                          hover:scale-[1.035]
                          hover:border-primary/45
                          hover:from-primary/20
                          hover:via-primary/15
                          hover:to-primary/25
                          hover:shadow-[0_10px_35px_-12px_rgba(99,102,241,0.75)]
                          active:translate-y-0
                          active:scale-[0.98]
                        `}
              `,
                children: [
                  !done && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "\r\n                    absolute inset-x-5 top-0\r\n                    h-px\r\n                    bg-gradient-to-r\r\n                    from-transparent\r\n                    via-white/15\r\n                    to-transparent\r\n                    opacity-70\r\n                    transition-opacity\r\n                    duration-200\r\n                    group-hover:opacity-100\r\n                  "
                    }
                  ),
                  !done && !highlighted && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "\r\n                    absolute\r\n                    left-1/2 top-1/2\r\n                    h-20 w-32\r\n                    -translate-x-1/2\r\n                    -translate-y-1/2\r\n                    rounded-full\r\n                    bg-primary/0\r\n                    blur-2xl\r\n                    transition-all\r\n                    duration-300\r\n                    group-hover:bg-primary/20\r\n                    pointer-events-none\r\n                  "
                    }
                  ),
                  highlighted && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: "\r\n                      absolute inset-0\r\n                      rounded-2xl\r\n                      border-2 border-white/60\r\n                      animate-ping\r\n                      pointer-events-none\r\n                    "
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "\r\n                      absolute\r\n                      left-1/2 top-1/2\r\n                      h-24 w-32\r\n                      -translate-x-1/2\r\n                      -translate-y-1/2\r\n                      rounded-full\r\n                      bg-white/15\r\n                      blur-2xl\r\n                      pointer-events-none\r\n                    "
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `
                  relative z-10
                  text-xl sm:text-2xl md:text-[2rem]
                  tracking-tight
                  transition-all
                  duration-200

                  ${highlighted ? `
                        text-white
                        scale-110
                        drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]
                      ` : done ? "text-transparent" : `
                          text-foreground
                          drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]
                          group-hover:text-white
                          group-hover:scale-105
                        `}
                `,
                      children: displayValue
                    }
                  ),
                  !done && !highlighted && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "\r\n                    absolute\r\n                    bottom-0 left-1/2\r\n                    h-px w-1/2\r\n                    -translate-x-1/2\r\n                    bg-gradient-to-r\r\n                    from-transparent\r\n                    via-primary/25\r\n                    to-transparent\r\n                    opacity-0\r\n                    transition-opacity\r\n                    duration-200\r\n                    group-hover:opacity-100\r\n                  "
                    }
                  )
                ]
              },
              `${cIdx}-${qIdx}`
            );
          })
        )
      ]
    }
  );
}
const Dialog = Root;
const DialogPortal = Portal;
const DialogOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = Overlay.displayName;
const DialogContent = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = Content.displayName;
const DialogTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = Title.displayName;
const DialogDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = Description.displayName;
function QuestionModal({
  open,
  question,
  value,
  category,
  players,
  onResolve,
  onClose
}) {
  const [revealed, setRevealed] = reactExports.useState(false);
  const [selectedPlayer, setSelectedPlayer] = reactExports.useState(null);
  const [timeLeft, setTimeLeft] = reactExports.useState(null);
  const [coGuessers, setCoGuessers] = reactExports.useState([]);
  const [
    correctCoGuessers,
    setCorrectCoGuessers
  ] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (open) {
      setRevealed(false);
      setSelectedPlayer(
        players.length === 1 ? 0 : null
      );
      setTimeLeft(null);
      setCoGuessers([]);
      setCorrectCoGuessers([]);
    }
  }, [open, players.length]);
  reactExports.useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev === null) {
          return null;
        }
        return prev - 1;
      });
    }, 1e3);
    return () => clearTimeout(timer);
  }, [timeLeft]);
  if (!question) {
    return null;
  }
  const toggleCoGuesser = (playerIndex) => {
    setCoGuessers(
      (prev) => prev.includes(playerIndex) ? prev.filter(
        (index) => index !== playerIndex
      ) : [...prev, playerIndex]
    );
    setCorrectCoGuessers(
      (prev) => prev.filter(
        (index) => index !== playerIndex
      )
    );
  };
  const toggleCorrectCoGuesser = (playerIndex) => {
    setCorrectCoGuessers(
      (prev) => prev.includes(playerIndex) ? prev.filter(
        (index) => index !== playerIndex
      ) : [...prev, playerIndex]
    );
  };
  const timerClass = timeLeft !== null && timeLeft <= 5 ? "text-destructive scale-110" : timeLeft !== null && timeLeft <= 10 ? "text-orange-400" : "text-primary";
  const timerProgress = timeLeft === null ? 0 : Math.min(
    100,
    Math.max(0, timeLeft)
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Dialog,
    {
      open,
      onOpenChange: (o) => !o && onClose(),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        DialogContent,
        {
          className: "\r\n          max-w-3xl\r\n          p-0\r\n          overflow-hidden\r\n          rounded-[1.75rem]\r\n          border border-white/[0.12]\r\n          bg-background/95\r\n          text-foreground\r\n          backdrop-blur-2xl\r\n          shadow-[0_25px_100px_-20px_rgba(0,0,0,0.8),0_0_60px_-20px_var(--indigo-glow)]\r\n        ",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "\r\n            relative\r\n            px-6 py-4\r\n            md:px-8 md:py-5\r\n            flex\r\n            items-center\r\n            justify-between\r\n            border-b\r\n            border-white/[0.08]\r\n            bg-gradient-to-r\r\n            from-primary/[0.08]\r\n            via-transparent\r\n            to-primary/[0.08]\r\n          ",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "\r\n              absolute\r\n              left-1/2 top-0\r\n              -translate-x-1/2\r\n              w-1/2 h-px\r\n              bg-gradient-to-r\r\n              from-transparent\r\n              via-primary/60\r\n              to-transparent\r\n            "
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "\r\n                h-2 w-2\r\n                rounded-full\r\n                bg-primary\r\n                shadow-[0_0_12px_var(--indigo-glow)]\r\n              "
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: "\r\n                font-display\r\n                text-sm md:text-base\r\n                uppercase\r\n                tracking-[0.22em]\r\n                text-foreground/90\r\n              ",
                        children: category
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "\r\n              relative\r\n              min-w-[72px]\r\n              rounded-xl\r\n              border\r\n              border-primary/30\r\n              bg-primary/[0.10]\r\n              px-4 py-2\r\n              text-center\r\n              shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_20px_-8px_var(--indigo-glow)]\r\n            ",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: "\r\n                font-display\r\n                text-xl md:text-2xl\r\n                text-primary\r\n              ",
                          style: {
                            textShadow: "0 0 20px oklch(0.55 0.24 278 / 0.75)"
                          },
                          children: value
                        }
                      )
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "\r\n            relative\r\n            min-h-64\r\n            md:min-h-[310px]\r\n            px-7 py-10\r\n            md:px-12 md:py-14\r\n            flex\r\n            items-center\r\n            justify-center\r\n            text-center\r\n            overflow-hidden\r\n          ",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: `
              absolute
              left-1/2 top-1/2
              -translate-x-1/2
              -translate-y-1/2
              h-48 w-[70%]
              rounded-full
              blur-[80px]
              pointer-events-none
              transition-all
              duration-500

              ${revealed ? "bg-emerald-500/[0.07]" : "bg-primary/[0.08]"}
            `
                    }
                  ),
                  revealed && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "\r\n                absolute\r\n                top-5\r\n                left-1/2\r\n                -translate-x-1/2\r\n                flex\r\n                items-center\r\n                gap-2\r\n                text-[10px]\r\n                md:text-xs\r\n                uppercase\r\n                tracking-[0.25em]\r\n                text-emerald-400/80\r\n                animate-in\r\n                fade-in\r\n                slide-in-from-top-2\r\n                duration-300\r\n              ",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5" }),
                        "Antwort"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      className: `
              relative z-10
              font-display
              uppercase
              leading-[1.15]
              whitespace-pre-line
              max-w-2xl
              animate-in
              fade-in
              zoom-in-95
              duration-300

              ${revealed ? "text-2xl md:text-4xl text-foreground" : "text-2xl md:text-[2.6rem] text-foreground"}
            `,
                      style: {
                        textShadow: "0 3px 30px rgba(0,0,0,0.35)"
                      },
                      children: revealed ? question.answer : question.question.replace(
                        /\s+(?=[A-D]:)/g,
                        "\n"
                      )
                    },
                    revealed ? "answer" : "question"
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "\r\n            relative\r\n            p-4 md:p-6\r\n            space-y-5\r\n            border-t\r\n            border-white/[0.08]\r\n            bg-gradient-to-b\r\n            from-white/[0.035]\r\n            to-primary/[0.045]\r\n          ",
                children: [
                  !revealed && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 justify-center", children: [
                        [20, 30, 60].map(
                          (seconds) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              variant: "outline",
                              onClick: () => setTimeLeft(
                                seconds
                              ),
                              className: `
                          rounded-xl
                          border-white/10
                          transition-all
                          duration-200

                          ${timeLeft === seconds ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-6px_var(--indigo-glow)]" : "bg-white/[0.03] hover:bg-white/[0.08]"}
                        `,
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Timer, { className: "mr-2 h-4 w-4" }),
                                seconds === 60 ? "1 Min." : `${seconds} Sek.`
                              ]
                            },
                            seconds
                          )
                        ),
                        timeLeft !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            variant: "ghost",
                            onClick: () => setTimeLeft(null),
                            className: "\r\n                        rounded-xl\r\n                        text-muted-foreground\r\n                        hover:text-foreground\r\n                        hover:bg-white/[0.05]\r\n                      ",
                            children: "Timer aus"
                          }
                        )
                      ] }),
                      timeLeft !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: `
                        text-center
                        font-display
                        text-4xl md:text-5xl
                        font-bold
                        transition-all
                        duration-300
                        ${timerClass}
                      `,
                            children: timeLeft === 0 ? "ZEIT!" : timeLeft
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: "\r\n                        mx-auto\r\n                        h-1\r\n                        max-w-xs\r\n                        overflow-hidden\r\n                        rounded-full\r\n                        bg-white/[0.07]\r\n                      ",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "div",
                              {
                                className: `
                          h-full
                          rounded-full
                          transition-all
                          duration-1000

                          ${timeLeft <= 5 ? "bg-destructive" : timeLeft <= 10 ? "bg-orange-400" : "bg-primary"}
                        `,
                                style: {
                                  width: `${timerProgress}%`
                                }
                              }
                            )
                          }
                        )
                      ] })
                    ] }),
                    players.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "\r\n                    pt-1\r\n                    rounded-2xl\r\n                  ",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "p",
                            {
                              className: "\r\n                      text-xs\r\n                      text-muted-foreground\r\n                      mb-3\r\n                      text-center\r\n                      uppercase\r\n                      tracking-[0.2em]\r\n                    ",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Hand, { className: "inline-block mr-2 h-4 w-4" }),
                                "Wer rät mit?"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 justify-center", children: players.map(
                            (player, index) => {
                              const active = coGuessers.includes(
                                index
                              );
                              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                "button",
                                {
                                  onClick: () => toggleCoGuesser(
                                    index
                                  ),
                                  className: `
                              px-4 py-2.5
                              rounded-xl
                              font-semibold
                              transition-all
                              duration-200
                              border

                              ${active ? `
                                    bg-amber-500
                                    text-amber-950
                                    border-amber-300
                                    scale-[1.04]
                                    shadow-[0_0_22px_-6px_rgba(245,158,11,0.7)]
                                  ` : `
                                    bg-white/[0.035]
                                    border-white/[0.08]
                                    text-foreground/75
                                    hover:text-foreground
                                    hover:bg-white/[0.08]
                                    hover:border-white/[0.15]
                                  `}
                            `,
                                  children: [
                                    active && "🙋 ",
                                    player.name
                                  ]
                                },
                                index
                              );
                            }
                          ) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground/70 mt-2.5 text-center", children: "Mitrater: richtig +25 % · falsch −25 %" })
                        ]
                      }
                    )
                  ] }),
                  !revealed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      onClick: () => setRevealed(true),
                      size: "lg",
                      className: "\r\n                group\r\n                relative\r\n                overflow-hidden\r\n                w-full\r\n                py-7\r\n                rounded-2xl\r\n                border\r\n                border-primary/40\r\n                bg-gradient-to-r\r\n                from-primary\r\n                via-violet-600\r\n                to-primary\r\n                font-display\r\n                text-lg md:text-xl\r\n                text-white\r\n                uppercase\r\n                tracking-[0.14em]\r\n                shadow-[0_0_30px_-8px_var(--indigo-glow)]\r\n                transition-all\r\n                duration-300\r\n                hover:scale-[1.01]\r\n                hover:shadow-[0_0_40px_-5px_var(--indigo-glow)]\r\n              ",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: "\r\n                  absolute\r\n                  inset-0\r\n                  bg-gradient-to-r\r\n                  from-transparent\r\n                  via-white/[0.08]\r\n                  to-transparent\r\n                  -translate-x-full\r\n                  group-hover:translate-x-full\r\n                  transition-transform\r\n                  duration-700\r\n                "
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "relative z-10 mr-2 h-5 w-5" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative z-10", children: "Antwort zeigen" })
                      ]
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    players.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "p",
                        {
                          className: "\r\n                      text-xs\r\n                      text-muted-foreground\r\n                      mb-3\r\n                      text-center\r\n                      uppercase\r\n                      tracking-[0.2em]\r\n                    ",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "inline-block mr-2 h-4 w-4" }),
                            "Wer hat die Hauptantwort gegeben?"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 justify-center", children: players.map(
                        (player, index) => {
                          const isCoGuesser = coGuessers.includes(
                            index
                          );
                          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "button",
                            {
                              disabled: isCoGuesser,
                              onClick: () => setSelectedPlayer(
                                index
                              ),
                              className: `
                              px-4 py-2.5
                              rounded-xl
                              font-semibold
                              transition-all
                              duration-200
                              border

                              ${isCoGuesser ? `
                                    opacity-30
                                    cursor-not-allowed
                                    bg-white/[0.03]
                                    border-white/[0.06]
                                    text-foreground/50
                                  ` : selectedPlayer === index ? `
                                      bg-primary
                                      text-primary-foreground
                                      border-primary
                                      scale-[1.04]
                                      shadow-[0_0_24px_-6px_var(--indigo-glow)]
                                    ` : `
                                      bg-white/[0.035]
                                      border-white/[0.08]
                                      text-foreground/80
                                      hover:text-foreground
                                      hover:bg-white/[0.08]
                                    `}
                            `,
                              title: isCoGuesser ? "Dieser Spieler ist als Mitrater angemeldet" : void 0,
                              children: [
                                player.name,
                                isCoGuesser && " · Mitrater"
                              ]
                            },
                            index
                          );
                        }
                      ) })
                    ] }),
                    coGuessers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "\r\n                    rounded-2xl\r\n                    border\r\n                    border-amber-500/20\r\n                    bg-amber-500/[0.04]\r\n                    p-4\r\n                  ",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "p",
                            {
                              className: "\r\n                      text-xs\r\n                      text-muted-foreground\r\n                      mb-3\r\n                      text-center\r\n                      uppercase\r\n                      tracking-[0.2em]\r\n                    ",
                              children: "Welche Mitrater waren richtig?"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 justify-center", children: coGuessers.map(
                            (playerIndex) => {
                              const correct = correctCoGuessers.includes(
                                playerIndex
                              );
                              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                "button",
                                {
                                  onClick: () => toggleCorrectCoGuesser(
                                    playerIndex
                                  ),
                                  className: `
                              px-4 py-2.5
                              rounded-xl
                              font-semibold
                              transition-all
                              duration-200
                              border

                              ${correct ? `
                                    bg-emerald-500
                                    text-emerald-950
                                    border-emerald-300
                                    shadow-[0_0_18px_-7px_rgba(16,185,129,0.8)]
                                  ` : `
                                    bg-destructive/15
                                    text-destructive
                                    border-destructive/35
                                    hover:bg-destructive/25
                                  `}
                            `,
                                  children: [
                                    correct ? "✓ " : "✗ ",
                                    players[playerIndex].name,
                                    correct ? ` +${Math.round(
                                      value * 0.25
                                    )}` : ` −${Math.round(
                                      value * 0.25
                                    )}`
                                  ]
                                },
                                playerIndex
                              );
                            }
                          ) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground/70 mt-3 text-center", children: "Grün = richtig · Rot = falsch" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          onClick: () => onResolve(
                            selectedPlayer,
                            false,
                            coGuessers,
                            correctCoGuessers
                          ),
                          disabled: players.length > 1 && selectedPlayer === null,
                          size: "lg",
                          className: "\r\n                    font-display\r\n                    text-base md:text-lg\r\n                    py-7\r\n                    rounded-2xl\r\n                    uppercase\r\n                    tracking-wider\r\n                    border\r\n                    border-destructive/30\r\n                    bg-destructive\r\n                    text-destructive-foreground\r\n                    hover:bg-destructive/90\r\n                    hover:scale-[1.01]\r\n                    transition-all\r\n                    shadow-[0_0_20px_-10px_rgba(239,68,68,0.8)]\r\n                  ",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "mr-2 h-5 w-5" }),
                            "Falsch"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          onClick: () => onResolve(
                            selectedPlayer,
                            true,
                            coGuessers,
                            correctCoGuessers
                          ),
                          disabled: players.length > 1 && selectedPlayer === null,
                          size: "lg",
                          className: "\r\n                    font-display\r\n                    text-base md:text-lg\r\n                    py-7\r\n                    rounded-2xl\r\n                    uppercase\r\n                    tracking-wider\r\n                    border\r\n                    border-emerald-300/30\r\n                    bg-emerald-500\r\n                    text-emerald-950\r\n                    hover:bg-emerald-400\r\n                    hover:scale-[1.01]\r\n                    transition-all\r\n                    shadow-[0_0_20px_-10px_rgba(16,185,129,0.8)]\r\n                  ",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-2 h-5 w-5" }),
                            "Richtig"
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: () => onResolve(
                          null,
                          false,
                          coGuessers,
                          correctCoGuessers
                        ),
                        className: "\r\n                  w-full\r\n                  text-xs\r\n                  text-muted-foreground/70\r\n                  hover:text-foreground\r\n                  py-1\r\n                  uppercase\r\n                  tracking-[0.2em]\r\n                  transition-colors\r\n                ",
                        children: "Überspringen (keine Hauptpunkte)"
                      }
                    )
                  ] })
                ]
              }
            )
          ]
        }
      )
    }
  );
}
function ScoreBoard({
  players,
  scorePopups = [],
  onScoreChange
}) {
  const [editingPlayer, setEditingPlayer] = reactExports.useState(null);
  const [editValue, setEditValue] = reactExports.useState("");
  const highestScore = players.length > 0 ? Math.max(...players.map((p) => p.score)) : 0;
  const leaders = players.filter(
    (p) => p.score === highestScore
  );
  const hasSingleLeader = leaders.length === 1;
  reactExports.useEffect(() => {
    if (editingPlayer !== null && !players[editingPlayer]) {
      setEditingPlayer(null);
      setEditValue("");
    }
  }, [players, editingPlayer]);
  const startEditing = (playerIndex) => {
    if (!onScoreChange) return;
    setEditingPlayer(playerIndex);
    setEditValue(String(players[playerIndex].score));
  };
  const cancelEditing = () => {
    setEditingPlayer(null);
    setEditValue("");
  };
  const saveScore = (playerIndex) => {
    const trimmedValue = editValue.trim();
    if (trimmedValue === "") {
      return;
    }
    const newScore = Number(trimmedValue);
    if (!Number.isFinite(newScore)) {
      return;
    }
    onScoreChange?.(
      playerIndex,
      Math.round(newScore)
    );
    setEditingPlayer(null);
    setEditValue("");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3", children: players.map((p, i) => {
    const isLeader = hasSingleLeader && p.score === highestScore;
    const playerPopups = scorePopups.filter(
      (popup) => popup.playerIndex === i
    );
    const isEditing = editingPlayer === i;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `
              group/player
              relative
              overflow-visible
              rounded-2xl
              px-3 py-3
              md:px-4 md:py-4
              text-center
              border
              transition-all
              duration-300

              ${isLeader ? `
                    border-amber-400/35
                    bg-gradient-to-br
                    from-amber-400/[0.10]
                    via-primary/[0.13]
                    to-primary/[0.18]
                    shadow-[0_0_30px_-10px_rgba(251,191,36,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]
                    scale-[1.025]
                  ` : `
                    border-white/[0.08]
                    bg-gradient-to-br
                    from-white/[0.07]
                    via-primary/[0.09]
                    to-primary/[0.14]
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
                  `}
            `,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `
                absolute
                left-1/2 top-1/2
                -translate-x-1/2
                -translate-y-1/2
                h-20 w-40
                rounded-full
                blur-3xl
                pointer-events-none

                ${isLeader ? "bg-amber-400/[0.08]" : "bg-primary/[0.08]"}
              `
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `
                absolute
                top-0 left-1/2
                -translate-x-1/2
                h-px
                w-2/3
                bg-gradient-to-r
                from-transparent
                to-transparent

                ${isLeader ? "via-amber-300/50" : "via-primary/30"}
              `
            }
          ),
          isLeader && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "\r\n                  absolute\r\n                  -top-3\r\n                  left-1/2\r\n                  -translate-x-1/2\r\n                  z-20\r\n                  h-7 w-7\r\n                  rounded-full\r\n                  flex items-center justify-center\r\n                  border border-amber-300/40\r\n                  bg-background\r\n                  shadow-[0_0_16px_rgba(251,191,36,0.35)]\r\n                ",
              title: "Aktuell in Führung",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-3.5 w-3.5 text-amber-400" })
            }
          ),
          playerPopups.map(
            (popup, popupIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none font-display font-bold whitespace-nowrap ${popup.amount > 0 ? "text-emerald-400" : "text-destructive"}`,
                style: {
                  top: `${-28 - popupIndex * 28}px`,
                  fontSize: "1.4rem",
                  textShadow: popup.amount > 0 ? "0 0 18px rgba(52, 211, 153, 0.9)" : "0 0 18px rgba(248, 113, 113, 0.9)",
                  animation: "score-popup 1.6s ease-out forwards"
                },
                children: [
                  popup.amount > 0 ? "+" : "−",
                  Math.abs(popup.amount),
                  popup.isCoGuesser && " 🙋"
                ]
              },
              popup.id
            )
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `
                relative z-10
                text-[9px] md:text-[10px]
                uppercase
                tracking-[0.24em]
                mb-1.5
                font-medium
                truncate

                ${isLeader ? "text-amber-200/80" : "text-muted-foreground"}
              `,
              children: p.name
            }
          ),
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex items-center justify-center gap-1 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                step: "1",
                value: editValue,
                onChange: (e) => setEditValue(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    saveScore(i);
                  }
                  if (e.key === "Escape") {
                    cancelEditing();
                  }
                },
                autoFocus: true,
                className: "\r\n                    w-24 md:w-28\r\n                    h-9\r\n                    rounded-xl\r\n                    bg-black/25\r\n                    border border-primary/30\r\n                    px-2\r\n                    text-center\r\n                    font-display\r\n                    text-xl\r\n                    text-foreground\r\n                    outline-none\r\n                    focus:border-primary\r\n                    focus:shadow-[0_0_15px_rgba(99,102,241,0.25)]\r\n                  "
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => saveScore(i),
                className: "\r\n                    h-9 w-9\r\n                    rounded-xl\r\n                    flex items-center justify-center\r\n                    bg-emerald-500/15\r\n                    text-emerald-400\r\n                    hover:bg-emerald-500/25\r\n                    transition-colors\r\n                  ",
                title: "Punktestand speichern",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: cancelEditing,
                className: "\r\n                    h-9 w-9\r\n                    rounded-xl\r\n                    flex items-center justify-center\r\n                    bg-destructive/15\r\n                    text-destructive\r\n                    hover:bg-destructive/25\r\n                    transition-colors\r\n                  ",
                title: "Abbrechen",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => startEditing(i),
              disabled: !onScoreChange,
              className: `
                  relative z-10
                  mx-auto
                  flex items-center justify-center
                  gap-2
                  rounded-xl
                  px-3 py-0.5
                  transition-all
                  duration-200

                  ${onScoreChange ? "cursor-pointer hover:bg-white/[0.06]" : "cursor-default"}
                `,
              title: onScoreChange ? "Punktestand korrigieren" : void 0,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `
                    font-display
                    text-2xl md:text-[2rem]
                    leading-none
                    transition-all
                    duration-200

                    ${p.score < 0 ? "text-destructive" : isLeader ? "text-foreground" : "text-foreground"}
                  `,
                    style: {
                      textShadow: isLeader ? "0 0 22px rgba(251,191,36,0.28)" : p.score > 0 ? "0 0 22px oklch(0.55 0.24 278 / 0.55)" : void 0
                    },
                    children: p.score
                  }
                ),
                onScoreChange && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Pencil,
                  {
                    className: "\r\n                      h-3.5 w-3.5\r\n                      text-muted-foreground/50\r\n                      opacity-40\r\n                      transition-all\r\n                      duration-200\r\n                      group-hover/player:opacity-100\r\n                      group-hover/player:text-primary\r\n                    "
                  }
                )
              ]
            }
          ),
          isLeader && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "\r\n                  absolute\r\n                  bottom-0\r\n                  left-1/2\r\n                  -translate-x-1/2\r\n                  h-px\r\n                  w-1/2\r\n                  bg-gradient-to-r\r\n                  from-transparent\r\n                  via-amber-400/60\r\n                  to-transparent\r\n                "
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
              @keyframes score-popup {
                0% {
                  opacity: 0;
                  transform: translate(-50%, 12px) scale(0.7);
                }

                15% {
                  opacity: 1;
                  transform: translate(-50%, 0px) scale(1.2);
                }

                35% {
                  opacity: 1;
                  transform: translate(-50%, -8px) scale(1);
                }

                75% {
                  opacity: 1;
                  transform: translate(-50%, -18px) scale(1);
                }

                100% {
                  opacity: 0;
                  transform: translate(-50%, -35px) scale(0.9);
                }
              }
            ` })
        ]
      },
      i
    );
  }) });
}
function getNamesWithHighestValue(players, stats, getter) {
  if (players.length === 0) return [];
  const highest = Math.max(...stats.map(getter));
  if (highest <= 0) return [];
  return players.filter((_, index) => getter(stats[index]) === highest).map((player) => player.name);
}
function GameStats({
  players,
  stats,
  onClose,
  onNewGame
}) {
  const highestScore = Math.max(
    ...players.map((player) => player.score)
  );
  const winners = players.filter(
    (player) => player.score === highestScore
  );
  const quizKings = getNamesWithHighestValue(
    players,
    stats,
    (stat) => stat.mainCorrect
  );
  const bestCoGuessers = getNamesWithHighestValue(
    players,
    stats,
    (stat) => stat.coCorrect
  );
  const pointCollectors = getNamesWithHighestValue(
    players,
    stats,
    (stat) => stat.pointsWon
  );
  const biggestLosses = getNamesWithHighestValue(
    players,
    stats,
    (stat) => stat.biggestLoss
  );
  const throneRaiders = getNamesWithHighestValue(
    players,
    stats,
    (stat) => stat.leadershipChanges
  );
  const getStatValue = (names, getter) => {
    if (names.length === 0) return 0;
    const index = players.findIndex(
      (player) => player.name === names[0]
    );
    return index >= 0 ? getter(stats[index]) : 0;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-[200] overflow-y-auto bg-background/95 backdrop-blur-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-12", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-16 w-16 md:h-20 md:w-20 mx-auto mb-4 text-amber-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs md:text-sm uppercase tracking-[0.3em] text-muted-foreground mb-2", children: "Endergebnis" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "h1",
        {
          className: "font-display text-4xl md:text-6xl uppercase text-foreground",
          style: {
            textShadow: "0 0 35px oklch(0.55 0.24 278 / 0.7)"
          },
          children: winners.length === 1 ? `${winners[0].name} gewinnt!` : "Unentschieden!"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl md:text-2xl mt-3 text-primary font-bold", children: [
        highestScore,
        " Punkte"
      ] }),
      winners.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: winners.map((winner) => winner.name).join(" & ") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 gap-4 mb-8", children: players.map((player, index) => {
      const playerStats = stats[index];
      const mainTotal = playerStats.mainCorrect + playerStats.mainWrong;
      const coTotal = playerStats.coCorrect + playerStats.coWrong;
      const mainAccuracy = mainTotal > 0 ? Math.round(
        playerStats.mainCorrect / mainTotal * 100
      ) : 0;
      const coAccuracy = coTotal > 0 ? Math.round(
        playerStats.coCorrect / coTotal * 100
      ) : 0;
      const isWinner = player.score === highestScore;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `glass-strong rounded-3xl p-5 md:p-6 border ${isWinner ? "border-amber-400/50 shadow-[0_0_35px_-10px_rgba(251,191,36,0.7)]" : "border-white/10"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 mb-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Spieler" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display text-2xl md:text-3xl uppercase flex items-center gap-2", children: [
                  isWinner && /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-6 w-6 text-amber-400" }),
                  player.name
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `font-display text-3xl ${player.score < 0 ? "text-destructive" : "text-primary"}`,
                  children: player.score
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-white/5 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-4 w-4" }),
                  "Hauptfragen"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-emerald-400", children: [
                    playerStats.mainCorrect,
                    " ✓"
                  ] }),
                  " · ",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-destructive", children: [
                    playerStats.mainWrong,
                    " ✗"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: mainTotal > 0 ? `${mainAccuracy} % richtig` : "Keine Hauptantwort" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-white/5 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Hand, { className: "h-4 w-4" }),
                  "Mitrater"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-emerald-400", children: [
                    playerStats.coCorrect,
                    " ✓"
                  ] }),
                  " · ",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-destructive", children: [
                    playerStats.coWrong,
                    " ✗"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: coTotal > 0 ? `${coAccuracy} % richtig` : "Nicht mitgeraten" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-emerald-500/5 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-wider mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" }),
                  "Gewonnen"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold text-emerald-400", children: [
                  "+",
                  playerStats.pointsWon
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-destructive/5 p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-destructive text-xs uppercase tracking-wider mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "h-4 w-4" }),
                  "Verloren"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold text-destructive", children: [
                  "−",
                  playerStats.pointsLost
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 mt-3 text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl glass p-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Höchststand" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold mt-1", children: playerStats.highestScore })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl glass p-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Bester Treffer" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-bold mt-1 text-emerald-400", children: [
                  "+",
                  playerStats.biggestGain
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl glass p-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Größter Verlust" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-bold mt-1 text-destructive", children: [
                  "−",
                  playerStats.biggestLoss
                ] })
              ] })
            ] })
          ]
        },
        index
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-strong rounded-3xl p-5 md:p-8 mb-8 border border-white/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl md:text-3xl uppercase text-center mb-6", children: "🏅 Awards" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [
        quizKings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Award,
          {
            emoji: "🎯",
            title: "Megamind",
            names: quizKings,
            detail: `${getStatValue(
              quizKings,
              (stat) => stat.mainCorrect
            )} richtige Hauptantworten`
          }
        ),
        bestCoGuessers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Award,
          {
            emoji: "🙋",
            title: "Sidekick",
            names: bestCoGuessers,
            detail: `${getStatValue(
              bestCoGuessers,
              (stat) => stat.coCorrect
            )} richtige Mitrater-Antworten`
          }
        ),
        pointCollectors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Award,
          {
            emoji: "🔥",
            title: "Punktemaster",
            names: pointCollectors,
            detail: `+${getStatValue(
              pointCollectors,
              (stat) => stat.pointsWon
            )} Punkte insgesamt erspielt`
          }
        ),
        biggestLosses.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Award,
          {
            emoji: "💀",
            title: "Loser",
            names: biggestLosses,
            detail: `−${getStatValue(
              biggestLosses,
              (stat) => stat.biggestLoss
            )} Punkte`
          }
        ),
        throneRaiders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Award,
          {
            emoji: "👑",
            title: "Thronräuber",
            names: throneRaiders,
            detail: `${getStatValue(
              throneRaiders,
              (stat) => stat.leadershipChanges
            )} FÜHRUNGSübernahmen`
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row justify-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: onClose,
          className: "rounded-xl",
          children: "Zurück zum Board"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: onNewGame,
          className: "rounded-xl",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-2 h-4 w-4" }),
            "Neues Spiel"
          ]
        }
      )
    ] })
  ] }) });
}
function Award({
  emoji,
  title,
  names,
  detail
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-white/5 border border-white/10 p-4 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl mb-2", children: emoji }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-xl uppercase mt-1", children: names.join(" & ") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: detail })
  ] });
}
const Textarea = reactExports.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        className: cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
function Editor({
  initial,
  initialMeta,
  onSave,
  onSaveMeta,
  onReset,
  onBack
}) {
  const [draft, setDraft] = reactExports.useState(
    () => initial.map((c) => ({ name: c.name, questions: c.questions.map((q) => ({ ...q })) }))
  );
  const [titleDraft, setTitleDraft] = reactExports.useState(initialMeta.title);
  const [subtitleDraft, setSubtitleDraft] = reactExports.useState(initialMeta.subtitle);
  const [activeCat, setActiveCat] = reactExports.useState(0);
  const updateCatName = (name) => {
    setDraft((prev) => prev.map((c, i) => i === activeCat ? { ...c, name } : c));
  };
  const updateQ = (qIdx, field, value) => {
    setDraft(
      (prev) => prev.map(
        (c, i) => i === activeCat ? {
          ...c,
          questions: c.questions.map(
            (q, j) => j === qIdx ? { ...q, [field]: value } : q
          )
        } : c
      )
    );
  };
  const updateQValue = (qIdx, value) => {
    setDraft(
      (prev) => prev.map(
        (c, i) => i === activeCat ? {
          ...c,
          questions: c.questions.map(
            (q, j) => j === qIdx ? { ...q, value } : q
          )
        } : c
      )
    );
  };
  const handleSave = () => {
    onSave(draft);
    onSaveMeta({
      title: titleDraft.trim() || initialMeta.title,
      subtitle: subtitleDraft.trim()
    });
    onBack();
  };
  const handleReset = () => {
    if (confirm("Alle Kategorien, Titel und Fragen auf Standard zurücksetzen?")) {
      onReset();
      onBack();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen p-3 md:p-6 max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between gap-2 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: onBack,
          className: "glass text-foreground hover:bg-white/15 border-white/15 rounded-xl",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
            " Zurück"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "h1",
        {
          className: "font-display text-xl md:text-3xl text-foreground tracking-tight uppercase",
          style: { textShadow: "0 0 30px oklch(0.55 0.24 278 / 0.6)" },
          children: "Bearbeiten"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleReset,
          className: "glass text-destructive hover:bg-destructive/20 border-destructive/30 rounded-xl",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-2 h-4 w-4" }),
            " Reset"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6", children: draft.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setActiveCat(i),
        className: `px-2 py-3 rounded-xl font-display text-xs md:text-sm uppercase tracking-wider transition-all truncate border ${activeCat === i ? "bg-primary text-primary-foreground border-transparent scale-105 shadow-[0_0_24px_-6px_var(--indigo-glow)]" : "glass text-foreground/80 hover:text-foreground hover:bg-white/10"}`,
        title: c.name,
        children: c.name || `Kat. ${i + 1}`
      },
      i
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-strong rounded-3xl p-4 md:p-6 space-y-4 glow-primary mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground uppercase tracking-[0.2em]", children: "Spiel-Kopfzeile" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs uppercase tracking-[0.18em] mb-1 block", children: "Titel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: titleDraft,
            onChange: (e) => setTitleDraft(e.target.value),
            className: "glass border-white/10 text-foreground font-display text-lg h-12 rounded-xl",
            maxLength: 40,
            placeholder: "Familienquiz"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs uppercase tracking-[0.18em] mb-1 block", children: "Untertitel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: subtitleDraft,
            onChange: (e) => setSubtitleDraft(e.target.value),
            className: "glass border-white/10 text-foreground h-11 rounded-xl",
            maxLength: 120,
            placeholder: "Das klassische Quizspiel – ganz nach euch."
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-strong rounded-3xl p-4 md:p-6 space-y-6 glow-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground text-xs uppercase tracking-[0.2em] mb-2 block", children: "Kategoriename" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: draft[activeCat].name,
            onChange: (e) => updateCatName(e.target.value),
            className: "glass border-white/10 text-foreground font-display text-lg h-12 rounded-xl",
            maxLength: 40
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-5", children: draft[activeCat].questions.map((q, qIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "glass rounded-2xl p-4 space-y-3",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground uppercase tracking-[0.18em]", children: "Punkte" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  min: 0,
                  value: q.value ?? POINT_VALUES[qIdx],
                  onChange: (e) => updateQValue(
                    qIdx,
                    e.target.value === "" ? void 0 : Number(e.target.value)
                  ),
                  className: "glass border-white/10 text-foreground font-display text-lg h-11 rounded-xl w-28"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground uppercase tracking-[0.18em]", children: "Frage" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  value: q.question,
                  onChange: (e) => updateQ(qIdx, "question", e.target.value),
                  rows: 2,
                  className: "glass border-white/10 text-foreground rounded-xl mt-1"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground uppercase tracking-[0.18em]", children: "Antwort" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: q.answer,
                  onChange: (e) => updateQ(qIdx, "answer", e.target.value),
                  className: "glass border-white/10 text-foreground rounded-xl mt-1 h-11"
                }
              )
            ] })
          ]
        },
        qIdx
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: handleSave,
          size: "lg",
          className: "w-full font-display text-lg md:text-xl py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider uppercase glow-primary border-0",
          children: "Änderungen speichern"
        }
      )
    ] })
  ] });
}
const supabaseUrl = "https://fmqiauqpcuytqnugitla.supabase.co";
const supabaseKey = "sb_publishable_Te2OOrJaSTAgBUPC1IQpzA_j-w6G15o";
const supabase = createClient(supabaseUrl, supabaseKey);
const DEFAULT_TITLE = "Familienquiz";
const DEFAULT_SUBTITLE = "Das klassische Quizspiel – ganz nach euch.";
const QUIZ_IDS = {
  1: "2f167918-a027-44f0-a012-422e802a7bef",
  2: "1dd72322-8420-43a8-a504-6665757232c6",
  3: "6a14ed4b-febe-483e-bf11-8211daa4b947",
  4: "ba7f1a27-2381-4c78-9967-e35679b112a8"
};
function isValidCategories(data) {
  if (!Array.isArray(data) || data.length < 1 || data.length > 10) {
    return false;
  }
  return data.every(
    (c) => c && typeof c.name === "string" && Array.isArray(c.questions) && c.questions.length === 5 && c.questions.every(
      (q) => q && typeof q.question === "string" && typeof q.answer === "string"
    )
  );
}
function isValidMeta(data) {
  return !!data && typeof data.title === "string" && typeof data.subtitle === "string";
}
function useCategories() {
  const [quizSlot, setQuizSlot] = reactExports.useState(1);
  const [categories, setCategories] = reactExports.useState(CATEGORIES);
  const [meta, setMeta] = reactExports.useState({
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE
  });
  const [loading, setLoading] = reactExports.useState(true);
  const categoriesRef = reactExports.useRef(categories);
  const metaRef = reactExports.useRef(meta);
  reactExports.useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);
  reactExports.useEffect(() => {
    metaRef.current = meta;
  }, [meta]);
  const loadQuiz = async (slot) => {
    const quizId = QUIZ_IDS[slot];
    setLoading(true);
    setQuizSlot(slot);
    const { data, error } = await supabase.from("quiz_data").select("data").eq("id", quizId).single();
    if (error) {
      console.error("Fehler beim Laden:", error);
      setLoading(false);
      return;
    }
    const quizData = data.data;
    const loadedMeta = quizData?.meta && isValidMeta(quizData.meta) ? quizData.meta : {
      title: slot === 1 ? DEFAULT_TITLE : `Quiz ${slot}`,
      subtitle: DEFAULT_SUBTITLE
    };
    if (quizData?.categories && isValidCategories(quizData.categories)) {
      categoriesRef.current = quizData.categories;
      metaRef.current = loadedMeta;
      setCategories(quizData.categories);
      setMeta(loadedMeta);
    } else {
      const freshCategories = structuredClone(CATEGORIES);
      categoriesRef.current = freshCategories;
      metaRef.current = loadedMeta;
      setCategories(freshCategories);
      setMeta(loadedMeta);
      const { error: initError } = await supabase.from("quiz_data").update({
        data: {
          categories: freshCategories,
          meta: loadedMeta
        },
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", quizId);
      if (initError) {
        console.error(
          `Quiz ${slot} konnte nicht initialisiert werden:`,
          initError
        );
      }
    }
    setLoading(false);
  };
  reactExports.useEffect(() => {
    loadQuiz(1);
  }, []);
  const saveAll = async (nextCategories, nextMeta) => {
    const quizId = QUIZ_IDS[quizSlot];
    const { data, error } = await supabase.from("quiz_data").update({
      data: {
        categories: nextCategories,
        meta: nextMeta
      },
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", quizId).select();
    console.log("SUPABASE UPDATE:", {
      slot: quizSlot,
      data,
      error
    });
    if (error) {
      console.error("Fehler beim Speichern:", error);
    }
  };
  const save = async (next) => {
    categoriesRef.current = next;
    setCategories(next);
    await saveAll(next, metaRef.current);
  };
  const saveMeta = async (next) => {
    metaRef.current = next;
    setMeta(next);
    await saveAll(categoriesRef.current, next);
  };
  const reset = async () => {
    const defaultMeta = {
      title: quizSlot === 1 ? DEFAULT_TITLE : `Quiz ${quizSlot}`,
      subtitle: DEFAULT_SUBTITLE
    };
    const freshCategories = structuredClone(CATEGORIES);
    categoriesRef.current = freshCategories;
    metaRef.current = defaultMeta;
    setCategories(freshCategories);
    setMeta(defaultMeta);
    await saveAll(freshCategories, defaultMeta);
  };
  return {
    categories,
    save,
    meta,
    saveMeta,
    reset,
    pointValues: POINT_VALUES,
    quizSlot,
    loadQuiz,
    loading
  };
}
function makeAnswered(categoryCount, questionCount) {
  return Array.from({
    length: categoryCount
  }, () => Array.from({
    length: questionCount
  }, () => false));
}
function makePlayerStats(count) {
  return Array.from({
    length: count
  }, () => ({
    mainCorrect: 0,
    mainWrong: 0,
    coCorrect: 0,
    coWrong: 0,
    pointsWon: 0,
    pointsLost: 0,
    highestScore: 0,
    biggestGain: 0,
    biggestLoss: 0,
    leadershipChanges: 0
  }));
}
function getSoleLeaderIndex(players) {
  if (players.length === 0) return null;
  const highestScore = Math.max(...players.map((player) => player.score));
  const leaders = players.map((player, index) => ({
    index,
    score: player.score
  })).filter((player) => player.score === highestScore);
  if (leaders.length !== 1) {
    return null;
  }
  return leaders[0].index;
}
function Index() {
  const {
    categories: allCategories,
    save,
    meta,
    saveMeta,
    reset,
    quizSlot,
    loadQuiz
  } = useCategories();
  const audioRef = reactExports.useRef(null);
  const finalAudioRef = reactExports.useRef(null);
  const tenseAudioRef = reactExports.useRef(null);
  const leaderRef = reactExports.useRef(null);
  const leadershipTimerRef = reactExports.useRef(null);
  const randomTimerRef = reactExports.useRef(null);
  const popupTimerRef = reactExports.useRef(null);
  const popupIdRef = reactExports.useRef(0);
  const [musicPlaying, setMusicPlaying] = reactExports.useState(false);
  const [musicVolume, setMusicVolume] = reactExports.useState(0.3);
  const [showVolume, setShowVolume] = reactExports.useState(false);
  const [leadershipChange, setLeadershipChange] = reactExports.useState(null);
  const [isRandomizing, setIsRandomizing] = reactExports.useState(false);
  const [highlightedQuestion, setHighlightedQuestion] = reactExports.useState(null);
  const [gameStats, setGameStats] = reactExports.useState([]);
  const [showStats, setShowStats] = reactExports.useState(false);
  const [scorePopups, setScorePopups] = reactExports.useState([]);
  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/music/background.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = musicVolume;
    }
    if (musicPlaying) {
      audioRef.current.pause();
      if (tenseAudioRef.current) {
        tenseAudioRef.current.pause();
      }
      setMusicPlaying(false);
    } else {
      if (tenseAudioRef.current) {
        tenseAudioRef.current.volume = musicVolume;
        tenseAudioRef.current.play().catch((error) => {
          console.error("Tense-Musik konnte nicht abgespielt werden:", error);
        });
      } else {
        audioRef.current.volume = musicVolume;
        audioRef.current.play().catch((error) => {
          console.error("Hintergrundmusik konnte nicht abgespielt werden:", error);
        });
      }
      setMusicPlaying(true);
    }
  };
  const changeMusicVolume = (volume) => {
    setMusicVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (tenseAudioRef.current) {
      tenseAudioRef.current.volume = volume;
    }
  };
  const stopFinalQuestionAudio = (resumeBackground = true) => {
    if (finalAudioRef.current) {
      finalAudioRef.current.pause();
      finalAudioRef.current.currentTime = 0;
      finalAudioRef.current = null;
    }
    if (tenseAudioRef.current) {
      tenseAudioRef.current.pause();
      tenseAudioRef.current.currentTime = 0;
      tenseAudioRef.current = null;
    }
    if (resumeBackground && musicPlaying && audioRef.current) {
      audioRef.current.volume = musicVolume;
      audioRef.current.play().catch((error) => {
        console.error("Hintergrundmusik konnte nicht fortgesetzt werden:", error);
      });
    }
  };
  const playFinalQuestionAudio = () => {
    stopFinalQuestionAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const finalSound = new Audio("/sounds/Sound_Effects/Final.mp3");
    finalSound.volume = 0.4;
    finalAudioRef.current = finalSound;
    finalSound.onended = () => {
      if (finalAudioRef.current === finalSound) {
        finalAudioRef.current = null;
      }
    };
    finalSound.play().catch((error) => {
      console.error("Final-Sound konnte nicht abgespielt werden:", error);
      if (finalAudioRef.current === finalSound) {
        finalAudioRef.current = null;
      }
    });
    if (musicPlaying) {
      const tenseMusic = new Audio("/music/Tense.mp3");
      tenseMusic.loop = true;
      tenseMusic.volume = musicVolume;
      tenseAudioRef.current = tenseMusic;
      tenseMusic.play().catch((error) => {
        console.error("Tense-Musik konnte nicht abgespielt werden:", error);
        if (tenseAudioRef.current === tenseMusic) {
          tenseAudioRef.current = null;
        }
      });
    }
  };
  const [screen, setScreen] = reactExports.useState("start");
  const [players, setPlayers] = reactExports.useState([]);
  const [activeCategoryCount, setActiveCategoryCount] = reactExports.useState(Math.min(6, allCategories.length));
  const categories = reactExports.useMemo(() => allCategories.slice(0, activeCategoryCount), [allCategories, activeCategoryCount]);
  const [answered, setAnswered] = reactExports.useState(() => makeAnswered(activeCategoryCount, POINT_VALUES.length));
  const [active, setActive] = reactExports.useState(null);
  const allAnswered = reactExports.useMemo(() => answered.every((row) => row.every(Boolean)), [answered]);
  const MusicControls = () => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", onClick: toggleMusic, className: `h-11 w-11 rounded-full border-primary/50 backdrop-blur-md transition-all duration-300 ${musicPlaying ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90" : "bg-background/70 text-primary hover:bg-primary hover:text-primary-foreground"}`, title: musicPlaying ? "Musik ausschalten" : "Musik einschalten", children: musicPlaying ? /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Music, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", onClick: () => setShowVolume((prev) => !prev), className: `h-11 w-11 rounded-full border-primary/50 backdrop-blur-md transition-all duration-300 ${showVolume ? "bg-primary text-primary-foreground" : "bg-background/70 text-primary hover:bg-primary hover:text-primary-foreground"}`, title: "Lautstärke", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-5 w-5" }) }),
    showVolume && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 glass px-3 py-2 rounded-2xl border border-white/10 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: "0", max: "1", step: "0.05", value: musicVolume, onChange: (e) => changeMusicVolume(Number(e.target.value)), className: "w-24 md:w-32 cursor-pointer" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground w-9 text-right", children: [
        Math.round(musicVolume * 100),
        "%"
      ] })
    ] })
  ] });
  if (screen === "editor") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Editor, { initial: allCategories, initialMeta: meta, onSave: save, onSaveMeta: saveMeta, onReset: reset, onBack: () => setScreen("start") });
  }
  if (screen === "start") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StartScreen, { title: meta.title, subtitle: meta.subtitle, maxCategories: allCategories.length, activeQuiz: quizSlot, onQuizChange: loadQuiz, onStart: (names, catCount) => {
        stopFinalQuestionAudio(false);
        setPlayers(names.map((name) => ({
          name,
          score: 0
        })));
        setGameStats(makePlayerStats(names.length));
        setActiveCategoryCount(catCount);
        setAnswered(makeAnswered(catCount, POINT_VALUES.length));
        leaderRef.current = null;
        setLeadershipChange(null);
        setHighlightedQuestion(null);
        setIsRandomizing(false);
        setShowStats(false);
        setScorePopups([]);
        if (leadershipTimerRef.current) {
          clearTimeout(leadershipTimerRef.current);
          leadershipTimerRef.current = null;
        }
        if (randomTimerRef.current) {
          clearTimeout(randomTimerRef.current);
          randomTimerRef.current = null;
        }
        if (popupTimerRef.current) {
          clearTimeout(popupTimerRef.current);
          popupTimerRef.current = null;
        }
        setScreen("game");
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed top-4 right-4 flex items-center gap-2 z-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MusicControls, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => setScreen("editor"), className: "border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-2 h-4 w-4" }),
          "Fragen bearbeiten"
        ] })
      ] })
    ] });
  }
  const activeQuestion = active !== null ? categories[active.category].questions[active.question] : null;
  const activeValue = active !== null ? categories[active.category].questions[active.question].value ?? POINT_VALUES[active.question] : 0;
  const activeCategory = active !== null ? categories[active.category].name : "";
  const openQuestion = (questionToOpen) => {
    const category = categories[questionToOpen.category];
    const lastQuestionIndex = category.questions.length - 1;
    const isFinalQuestion = questionToOpen.question === lastQuestionIndex;
    if (isFinalQuestion) {
      playFinalQuestionAudio();
    } else {
      stopFinalQuestionAudio();
    }
    setActive(questionToOpen);
  };
  const closeQuestion = () => {
    stopFinalQuestionAudio();
    setActive(null);
  };
  const selectRandomQuestion = () => {
    if (isRandomizing) return;
    const availableQuestions = [];
    answered.forEach((row, categoryIndex) => {
      row.forEach((isAnswered, questionIndex) => {
        if (!isAnswered) {
          availableQuestions.push({
            category: categoryIndex,
            question: questionIndex
          });
        }
      });
    });
    if (availableQuestions.length === 0) {
      return;
    }
    setIsRandomizing(true);
    const finalQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    const delays = [70, 80, 90, 100, 110, 120, 140, 160, 190, 230, 280];
    let step = 0;
    let previousQuestion = null;
    const runRoulette = () => {
      const isFinalStep = step >= delays.length;
      if (isFinalStep) {
        setHighlightedQuestion(finalQuestion);
        randomTimerRef.current = setTimeout(() => {
          setIsRandomizing(false);
          setHighlightedQuestion(null);
          openQuestion(finalQuestion);
          randomTimerRef.current = null;
        }, 600);
        return;
      }
      let randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      if (availableQuestions.length > 1 && previousQuestion) {
        while (randomQuestion.category === previousQuestion.category && randomQuestion.question === previousQuestion.question) {
          randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        }
      }
      previousQuestion = randomQuestion;
      setHighlightedQuestion(randomQuestion);
      randomTimerRef.current = setTimeout(() => {
        step++;
        runRoulette();
      }, delays[step]);
    };
    runRoulette();
  };
  const handleResolve = (playerIndex, correct, coGuessers = [], correctCoGuessers = []) => {
    if (!active) return;
    stopFinalQuestionAudio();
    const wrongSounds = [{
      path: "/sounds/Wrong/Dummkopf.WAV",
      volume: 1
    }, {
      path: "/sounds/Wrong/HAHA.WAV",
      volume: 0.5
    }, {
      path: "/sounds/Wrong/Homer Simpson Langweilig.mp3",
      volume: 0.4
    }, {
      path: "/sounds/Wrong/Homer Simpson Nein!.mp3",
      volume: 1
    }, {
      path: "/sounds/Wrong/Nein, Nein, Nein, Nein! (Hitler Meme) - Sound Effect for editing.mp3",
      volume: 0.8
    }, {
      path: "/sounds/Wrong/zonk.mp3",
      volume: 0.3
    }, {
      path: "/sounds/Wrong/Mario Fail.mp3",
      volume: 0.6
    }];
    const correctSounds = [{
      path: "/sounds/Correct/Ja sound effect Hitler.mp3",
      volume: 0.9
    }, {
      path: "/sounds/Correct/Who Wants to Be a Millionaire - £100 – £500 Correct Answer [SOUND EFFECT].mp3",
      volume: 0.7
    }, {
      path: "/sounds/Correct/Zelda Receive Item - Sound Effect for editing.mp3",
      volume: 0.4
    }, {
      path: "/sounds/Correct/Zeldariddle.mp3",
      volume: 0.2
    }, {
      path: "/sounds/Correct/Yeah Baby Yea.WAV",
      volume: 1
    }, {
      path: "/sounds/Correct/Al.WAV",
      volume: 1
    }];
    const soundData = correct ? correctSounds[Math.floor(Math.random() * correctSounds.length)] : wrongSounds[Math.floor(Math.random() * wrongSounds.length)];
    const sound = new Audio(soundData.path);
    sound.volume = soundData.volume;
    sound.play().catch((error) => {
      console.error("Sound konnte nicht abgespielt werden:", soundData.path, error);
    });
    const coGuesserPoints = Math.round(activeValue * 0.25);
    setPlayers((prev) => {
      const previousLeader = leaderRef.current;
      const scoreChanges = prev.map((_, index) => {
        let scoreChange = 0;
        if (index === playerIndex) {
          scoreChange += correct ? activeValue : -Math.round(activeValue / 2);
        }
        if (index !== playerIndex && coGuessers.includes(index)) {
          scoreChange += correctCoGuessers.includes(index) ? coGuesserPoints : -coGuesserPoints;
        }
        return scoreChange;
      });
      const nextPlayers = prev.map((player, index) => ({
        ...player,
        score: player.score + scoreChanges[index]
      }));
      const newPopups = scoreChanges.map((amount, index) => ({
        id: ++popupIdRef.current,
        playerIndex: index,
        amount,
        isCoGuesser: index !== playerIndex && coGuessers.includes(index)
      })).filter((popup) => popup.amount !== 0);
      setScorePopups(newPopups);
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
      popupTimerRef.current = setTimeout(() => {
        setScorePopups([]);
        popupTimerRef.current = null;
      }, 1600);
      const newLeader = getSoleLeaderIndex(nextPlayers);
      setGameStats((previousStats) => previousStats.map((stat, index) => {
        const scoreChange = scoreChanges[index];
        const isMainPlayer = index === playerIndex;
        const isCoGuesser = index !== playerIndex && coGuessers.includes(index);
        const coGuesserCorrect = correctCoGuessers.includes(index);
        const becameLeader = newLeader === index && newLeader !== previousLeader;
        return {
          ...stat,
          mainCorrect: stat.mainCorrect + (isMainPlayer && correct ? 1 : 0),
          mainWrong: stat.mainWrong + (isMainPlayer && !correct ? 1 : 0),
          coCorrect: stat.coCorrect + (isCoGuesser && coGuesserCorrect ? 1 : 0),
          coWrong: stat.coWrong + (isCoGuesser && !coGuesserCorrect ? 1 : 0),
          pointsWon: stat.pointsWon + (scoreChange > 0 ? scoreChange : 0),
          pointsLost: stat.pointsLost + (scoreChange < 0 ? Math.abs(scoreChange) : 0),
          highestScore: Math.max(stat.highestScore, nextPlayers[index].score),
          biggestGain: Math.max(stat.biggestGain, scoreChange > 0 ? scoreChange : 0),
          biggestLoss: Math.max(stat.biggestLoss, scoreChange < 0 ? Math.abs(scoreChange) : 0),
          leadershipChanges: stat.leadershipChanges + (becameLeader ? 1 : 0)
        };
      }));
      if (newLeader !== null && newLeader !== previousLeader) {
        const leader = nextPlayers[newLeader];
        setLeadershipChange({
          playerName: leader.name,
          score: leader.score
        });
        if (leadershipTimerRef.current) {
          clearTimeout(leadershipTimerRef.current);
        }
        leadershipTimerRef.current = setTimeout(() => {
          setLeadershipChange(null);
          leadershipTimerRef.current = null;
        }, 2500);
      }
      leaderRef.current = newLeader;
      return nextPlayers;
    });
    setAnswered((prev) => {
      const next = prev.map((row) => [...row]);
      next[active.category][active.question] = true;
      return next;
    });
    setActive(null);
  };
  const handleManualScoreChange = (playerIndex, newScore) => {
    setPlayers((prev) => {
      const nextPlayers = prev.map((player, index) => index === playerIndex ? {
        ...player,
        score: newScore
      } : player);
      leaderRef.current = getSoleLeaderIndex(nextPlayers);
      return nextPlayers;
    });
  };
  const winner = allAnswered ? [...players].sort((a, b) => b.score - a.score)[0] : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen p-3 md:p-6 max-w-7xl mx-auto", children: [
    showStats && /* @__PURE__ */ jsxRuntimeExports.jsx(GameStats, { players, stats: gameStats, onClose: () => setShowStats(false), onNewGame: () => {
      stopFinalQuestionAudio(false);
      setShowStats(false);
      setScreen("start");
    } }),
    leadershipChange && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-300" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative glass-strong border border-amber-400/40 rounded-3xl px-8 py-7 md:px-14 md:py-10 text-center shadow-2xl animate-in zoom-in-75 fade-in duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-14 w-14 md:h-20 md:w-20 mx-auto mb-3 text-amber-400 drop-shadow-lg" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-lg md:text-2xl uppercase tracking-[0.2em] text-amber-400 mb-2", children: "Neue Führung!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-3xl md:text-5xl uppercase text-foreground", children: leadershipChange.playerName }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-lg md:text-2xl text-muted-foreground", children: [
          "übernimmt mit",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-bold", children: leadershipChange.score }),
          " ",
          "Punkten!"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed top-4 right-4 z-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MusicControls, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl md:text-5xl text-foreground tracking-tight uppercase", style: {
        textShadow: "0 0 30px oklch(0.55 0.24 278 / 0.6)"
      }, children: meta.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: selectRandomQuestion, disabled: allAnswered || isRandomizing, className: `glass text-foreground hover:bg-primary hover:text-primary-foreground border-white/15 rounded-xl ${isRandomizing ? "animate-pulse" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Dices, { className: `mr-2 h-4 w-4 ${isRandomizing ? "animate-spin" : ""}` }),
          isRandomizing ? "Würfelt..." : "Zufallsfrage"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => {
          stopFinalQuestionAudio(false);
          setScreen("start");
        }, disabled: isRandomizing, className: "glass text-foreground hover:bg-white/15 border-white/15 rounded-xl", children: "Neues Spiel" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 md:mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBoard, { players, scorePopups, onScoreChange: handleManualScoreChange }) }),
    winner && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 md:mb-6 glass-strong rounded-3xl p-5 md:p-6 text-center glow-primary animate-in fade-in zoom-in", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-display text-2xl md:text-4xl uppercase text-foreground tracking-wide mb-4", children: [
        "🏆 ",
        winner.name,
        " gewinnt mit ",
        winner.score,
        "!"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowStats(true), size: "lg", className: "rounded-2xl font-display uppercase tracking-wider", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "mr-2 h-5 w-5" }),
        "Auswertung anzeigen"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Board, { categories, answered, highlightedQuestion, isRandomizing, onSelect: (category, question) => openQuestion({
      category,
      question
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(QuestionModal, { open: active !== null, question: activeQuestion, value: activeValue, category: activeCategory, players, onResolve: handleResolve, onClose: closeQuestion })
  ] });
}
export {
  Index as component
};
