# AI review rules

Team code standards the AI review checks on every changed file.

- `## BLOCK: <rule-id>` fails the CI build when broken.
- `## WARN: <rule-id>` is reported but does not fail the build.

Add, remove, or move a rule between BLOCK and WARN by editing this file. The rule id must be
lowercase-with-dashes. Everything under a heading (until the next heading) is the rule text
the reviewer reads, so write it as you would explain it to a new developer.

## BLOCK: single-responsibility

A component or function must do one job, and only the job its name says.
Block when a component mixes concerns that belong in separate places, for example:

- a `Modal` that also fetches or uploads data, holds business state, or renders a whole
  feature (an icon picker, a form) instead of rendering `children` and handling open/close;
- a component that does data fetching, data transformation and complex rendering all in one;
- a function that does several unrelated things that should be separate functions or a custom hook.

Suggest how to split it (e.g. a generic `Modal` + an `IconPicker` child + a `useIconUpload` hook).

## BLOCK: early-return

Prefer guard clauses and early returns over wrapping the main body in a condition. Block:

- `return shown ? (<large JSX>) : null` when `if (!shown) return null;` followed by the JSX works;
- `if (ok) { ...whole function body... }` that can be `if (!ok) return;`;
- if/else chains nested two or more levels deep that early returns would flatten.

Short, simple ternaries (a few lines) are fine.

## BLOCK: naming-match

Names must match. Block when:

- a React component's function name does not match its file name
  (`AvatarEditModal.tsx` must define/export `AvatarEditModal`, not `Modal`);
- a component, function, or hook name does not describe what it actually does
  (a component named `Modal` that is really an icon picker);
- the default export name differs from the file name;
- a props interface does not match its component (`IModalProps` for `IconPicker`).

## BLOCK: typo

Block spelling mistakes in identifiers (variables, functions, components, types, props),
file and folder names, CSS class names, user-facing text, and comments
(e.g. `recieve`, `seperate`, `lenght`, `sucess`, `fiel`).
Ignore words that come from external APIs or libraries and intentional abbreviations
(`btn`, `props`, `env`, `ctx`).

## BLOCK: css-universal-selector

Do not use the universal selector `*` in `.css` or `.scss` files. This covers `* { }`,
`*::before`, `*::after`, and descendant forms like `.card *` or `.list > *`.
It leaks styles globally, breaks component isolation, and hurts performance.
Style specific classes or elements instead.

## WARN: no-any

Avoid `any` in TypeScript (e.g. `(e: any)`, `(res: any)`). Use the real type
(`React.ChangeEvent<HTMLInputElement>`, an API response interface) or `unknown` and narrow it.

## WARN: duplicated-code

Flag copy-pasted logic or markup that should be shared, e.g. two `.map()` calls rendering
identical JSX that differ only in the array they loop over.

## WARN: async-error-handling

Promises (`.then(...)` or `await`) whose failure is silently ignored: no `.catch`, no
try/catch, no error state shown to the user.

## WARN: accessibility

Interactive elements must be usable with a keyboard and screen reader: no `onClick` on
non-interactive elements without a role and key handler, no `aria-hidden="true"` on content
the user interacts with, meaningful `alt` text on images.
