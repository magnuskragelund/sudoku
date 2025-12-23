#!/usr/bin/env node

/**
 * Generate locale translations from en-us.json
 * Uses locale-generation-prompt.json for guidelines
 * 
 * Usage:
 *   node generateLocales.js <locale>                    # Generate single locale
 *   node generateLocales.js --all                       # Generate all missing locales
 *   node generateLocales.js --prompt <locale>           # Generate prompt for manual translation
 *   node generateLocales.js --api openai <locale>       # Use OpenAI API
 *   node generateLocales.js --api anthropic <locale>    # Use Anthropic API
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const LOCALES_DIR = path.join(__dirname, 'locales');
const SOURCE_LOCALE = 'en-us';
const SOURCE_FILE = path.join(LOCALES_DIR, `${SOURCE_LOCALE}.json`);
const PROMPT_FILE = path.join(LOCALES_DIR, 'locale-generation-prompt.json');

// Known locales that should exist
const KNOWN_LOCALES = [
  'da', 'de-de', 'en-gb', 'es-es', 'fr-fr', 'it', 'ja', 'ko', 
  'pt-br', 'zh-hans', 'zh-hant'
];

/**
 * Get locale name for display
 */
function getLocaleName(locale) {
  const names = {
    'da': 'Danish',
    'de-de': 'German (Germany)',
    'en-gb': 'English (UK)',
    'es-es': 'Spanish (Spain)',
    'fr-fr': 'French (France)',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'pt-br': 'Portuguese (Brazil)',
    'zh-hans': 'Chinese (Simplified)',
    'zh-hant': 'Chinese (Traditional)'
  };
  return names[locale] || locale;
}

/**
 * Load source locale and prompt guidelines
 */
function loadSourceData() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(PROMPT_FILE)) {
    console.error(`❌ Prompt file not found: ${PROMPT_FILE}`);
    process.exit(1);
  }

  const sourceContent = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
  const promptGuidelines = JSON.parse(fs.readFileSync(PROMPT_FILE, 'utf8'));

  return { sourceContent, promptGuidelines };
}

/**
 * Build translation prompt
 */
function buildPrompt(sourceContent, promptGuidelines, targetLocale) {
  const localeName = getLocaleName(targetLocale);
  
  const guidelines = `
TRANSLATION GUIDELINES:
${JSON.stringify(promptGuidelines, null, 2)}

TARGET LOCALE: ${targetLocale} (${localeName})

SOURCE CONTENT (English - en-us):
${JSON.stringify(sourceContent, null, 2)}

INSTRUCTIONS:
1. Translate the source content to ${localeName} (locale code: ${targetLocale})
2. Follow all guidelines in the translation guidelines above
3. Maintain the exact JSON structure
4. Keep "appName" as "Sudoku Face Off" (brand name)
5. Keep "supportUrl" unchanged
6. Adapt all other fields naturally for the target language and culture
7. Ensure keywords include both local language terms and "sudoku" for SEO
8. Return ONLY valid JSON, no explanations or markdown formatting

TRANSLATED JSON:`;

  return guidelines;
}

/**
 * Generate prompt file for manual translation
 */
function generatePromptFile(targetLocale) {
  const { sourceContent, promptGuidelines } = loadSourceData();
  const prompt = buildPrompt(sourceContent, promptGuidelines, targetLocale);
  
  const promptFile = path.join(LOCALES_DIR, `${targetLocale}-prompt.txt`);
  fs.writeFileSync(promptFile, prompt, 'utf8');
  
  console.log(`\n✅ Generated prompt file: ${promptFile}`);
  console.log(`\n💡 Use this prompt with your AI assistant to generate the translation.`);
  console.log(`   Then save the JSON response as: locales/${targetLocale}.json\n`);
  
  return promptFile;
}

/**
 * Call OpenAI API for translation
 */
async function translateWithOpenAI(targetLocale) {
  const { sourceContent, promptGuidelines } = loadSourceData();
  const prompt = buildPrompt(sourceContent, promptGuidelines, targetLocale);
  
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    console.error('   Set it with: export OPENAI_API_KEY=your-key-here');
    process.exit(1);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator specializing in app store copy localization. Return only valid JSON, no markdown, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const translatedContent = JSON.parse(data.choices[0].message.content);
    
    return translatedContent;
  } catch (error) {
    console.error(`❌ Error calling OpenAI API:`, error.message);
    throw error;
  }
}

/**
 * Call Anthropic API for translation
 */
async function translateWithAnthropic(targetLocale) {
  const { sourceContent, promptGuidelines } = loadSourceData();
  const prompt = buildPrompt(sourceContent, promptGuidelines, targetLocale);
  
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable not set');
    console.error('   Set it with: export ANTHROPIC_API_KEY=your-key-here');
    process.exit(1);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `You are a professional translator specializing in app store copy localization. Return only valid JSON, no markdown, no explanations.\n\n${prompt}`
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Extract JSON from response (handle markdown code blocks if present)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    }
    
    const translatedContent = JSON.parse(jsonContent);
    
    return translatedContent;
  } catch (error) {
    console.error(`❌ Error calling Anthropic API:`, error.message);
    throw error;
  }
}

/**
 * Save translated content to locale file
 */
function saveLocaleFile(locale, content) {
  const targetFile = path.join(LOCALES_DIR, `${locale}.json`);
  fs.writeFileSync(targetFile, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✅ Saved: ${targetFile}`);
}

/**
 * Check if locale file exists
 */
function localeExists(locale) {
  const targetFile = path.join(LOCALES_DIR, `${locale}.json`);
  return fs.existsSync(targetFile);
}

/**
 * Get missing locales
 */
function getMissingLocales() {
  return KNOWN_LOCALES.filter(locale => !localeExists(locale));
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n📝 LOCALE TRANSLATION GENERATOR\n');
    console.log('Usage:');
    console.log('  node generateLocales.js <locale>              # Generate single locale');
    console.log('  node generateLocales.js --all                  # Generate all missing locales');
    console.log('  node generateLocales.js --prompt <locale>      # Generate prompt file for manual translation');
    console.log('  node generateLocales.js --api openai <locale>  # Use OpenAI API');
    console.log('  node generateLocales.js --api anthropic <locale> # Use Anthropic API');
    console.log('\nExamples:');
    console.log('  node generateLocales.js --prompt fr-fr');
    console.log('  node generateLocales.js --api openai de-de');
    console.log('  node generateLocales.js --all\n');
    process.exit(0);
  }

  // Handle --prompt flag
  if (args[0] === '--prompt') {
    const targetLocale = args[1];
    if (!targetLocale) {
      console.error('❌ Please specify a locale (e.g., fr-fr, de-de)');
      process.exit(1);
    }
    generatePromptFile(targetLocale);
    return;
  }

  // Handle --all flag
  if (args[0] === '--all') {
    const missing = getMissingLocales();
    if (missing.length === 0) {
      console.log('\n✅ All known locales already exist!\n');
      return;
    }
    
    console.log(`\n📝 Generating prompts for ${missing.length} missing locale(s):\n`);
    missing.forEach(locale => {
      console.log(`  - ${locale} (${getLocaleName(locale)})`);
      generatePromptFile(locale);
    });
    console.log('\n💡 Review and use these prompts with your AI assistant to generate translations.\n');
    return;
  }

  // Handle --api flag
  if (args[0] === '--api') {
    const apiProvider = args[1];
    const targetLocale = args[2];
    
    if (!apiProvider || !targetLocale) {
      console.error('❌ Usage: node generateLocales.js --api <provider> <locale>');
      console.error('   Providers: openai, anthropic');
      process.exit(1);
    }

    if (localeExists(targetLocale)) {
      console.log(`⚠️  Locale ${targetLocale} already exists. Overwriting...`);
    }

    console.log(`\n🌐 Translating ${targetLocale} (${getLocaleName(targetLocale)}) using ${apiProvider}...\n`);

    try {
      let translatedContent;
      
      if (apiProvider === 'openai') {
        translatedContent = await translateWithOpenAI(targetLocale);
      } else if (apiProvider === 'anthropic') {
        translatedContent = await translateWithAnthropic(targetLocale);
      } else {
        console.error(`❌ Unknown API provider: ${apiProvider}`);
        console.error('   Supported providers: openai, anthropic');
        process.exit(1);
      }

      saveLocaleFile(targetLocale, translatedContent);
      console.log(`\n✅ Translation complete! Review the file before pushing to stores.\n`);
    } catch (error) {
      console.error(`\n❌ Translation failed:`, error.message);
      process.exit(1);
    }
    return;
  }

  // Default: generate prompt for single locale
  const targetLocale = args[0];
  if (!KNOWN_LOCALES.includes(targetLocale)) {
    console.log(`⚠️  Warning: ${targetLocale} is not in the known locales list.`);
    console.log(`   Continuing anyway...\n`);
  }

  if (localeExists(targetLocale)) {
    console.log(`⚠️  Locale ${targetLocale} already exists.`);
    console.log(`   Generating new prompt anyway...\n`);
  }

  generatePromptFile(targetLocale);
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ (for fetch API)');
  console.error('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
