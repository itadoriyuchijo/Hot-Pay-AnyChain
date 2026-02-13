## Packages
(none needed)

## Notes
Uses existing shadcn/ui components already in repo (Dialog, Form, Button, Card, Table, Sheet, etc.)
All API calls use @shared/routes `api.*.path` + Zod runtime validation with safeParse logging.
Invoice numeric fields: amount is sent/received as string; form uses string input and server validation.
SEO: pages set document.title + basic meta description + OpenGraph tags at runtime.
