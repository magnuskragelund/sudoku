# App Store Locales

This directory contains all app store copy for different languages.

## File Format

Each file should be named: `{language}-{country}.json` (lowercase)

Examples:
- `en-us.json` - English (United States)
- `de-de.json` - German (Germany)
- `fr-fr.json` - French (France)
- `es-es.json` - Spanish (Spain)

## Structure

Each JSON file must contain:

```json
{
  "appName": "Your App Name",
  "subtitle": "Short subtitle (max 30 chars)",
  "description": "Full description with \\n\\n for paragraph breaks",
  "keywords": "keyword1, keyword2, keyword3"
}
```

## Adding a New Language

1. Copy an existing locale file (e.g., `en-us.json`)
2. Rename it to your target locale (e.g., `fr-fr.json`)
3. Translate all the content
4. Run the push scripts from the parent directory

The scripts will automatically detect and push all locale files in this directory.

## Guidelines

### App Name
- Usually stays the same across all locales
- Some apps translate it, others don't

### Subtitle
- Max 30 characters for Apple App Store
- Should be catchy and descriptive
- Highlight key feature or benefit

### Description
- Use `\n\n` to separate paragraphs
- Include section headers for clarity
- First paragraph is most important (users see it first)
- Focus on benefits, not just features

### Keywords
- Comma-separated list
- Max 100 characters for Apple App Store
- Research popular search terms in each language
- Avoid duplicate words (they don't help)
- Don't include app name (it's automatic)

## Testing

Test a single locale before pushing all:

```bash
# From parent directory
node pushToAppStore.js en-us
```

Then push all locales:

```bash
# From parent directory
node pushAllToBoth.js
```

