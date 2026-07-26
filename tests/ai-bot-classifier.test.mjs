import assert from "node:assert/strict";
import test from "node:test";

import { classifyAiBot } from "../lib/ai-visits/classify.ts";

const cases = [
  ["GPTBot/1.0", "gptbot", "GPTBot", "OpenAI", "training"],
  ["OAI-SearchBot/1.0", "oai-searchbot", "OAI-SearchBot", "OpenAI", "search_indexing"],
  ["ChatGPT-User/1.0", "chatgpt-user", "ChatGPT-User", "OpenAI", "realtime_citation"],
  ["OAI-AdsBot/1.0", "oai-adsbot", "OAI-AdsBot", "OpenAI", "other"],
  ["ClaudeBot/1.0", "claudebot", "ClaudeBot", "Anthropic", "training"],
  ["Claude-SearchBot/1.0", "claude-searchbot", "Claude-SearchBot", "Anthropic", "search_indexing"],
  ["Claude-User/1.0", "claude-user", "Claude-User", "Anthropic", "realtime_citation"],
  ["Claude-Web/1.0", "claude-web", "Claude-Web", "Anthropic", "realtime_citation"],
  ["anthropic-ai", "anthropic-ai", "anthropic-ai", "Anthropic", "training"],
  ["PerplexityBot/1.0", "perplexitybot", "PerplexityBot", "Perplexity", "search_indexing"],
  ["Perplexity-User/1.0", "perplexity-user", "Perplexity-User", "Perplexity", "realtime_citation"],
  ["Googlebot/2.1", "googlebot", "Googlebot", "Google", "search_indexing"],
  ["Googlebot-Image/1.0", "googlebot-image", "Googlebot-Image", "Google", "search_indexing"],
  ["Googlebot-Video/1.0", "googlebot-video", "Googlebot-Video", "Google", "search_indexing"],
  ["GoogleOther/1.0", "googleother", "GoogleOther", "Google", "search_indexing"],
  ["GoogleOther-Image/1.0", "googleother-image", "GoogleOther-Image", "Google", "search_indexing"],
  ["GoogleOther-Video/1.0", "googleother-video", "GoogleOther-Video", "Google", "search_indexing"],
  ["Google-Extended", "google-extended", "Google-Extended", "Google", "training"],
  ["Yeti/1.1", "yeti", "Yeti", "Naver", "search_indexing"],
  ["NaverBot/1.0", "naverbot", "NaverBot", "Naver", "search_indexing"],
  ["bingbot/2.0", "bingbot", "bingbot", "Microsoft", "search_indexing"],
  ["msnbot/2.0", "msnbot", "msnbot", "Microsoft", "search_indexing"],
  ["BingPreview/1.0", "bingpreview", "BingPreview", "Microsoft", "search_indexing"],
  ["MicrosoftPreview/1.0", "microsoftpreview", "MicrosoftPreview", "Microsoft", "search_indexing"],
  ["Applebot/1.0", "applebot", "Applebot", "Apple", "search_indexing"],
  ["Applebot-Extended/1.0", "applebot-extended", "Applebot-Extended", "Apple", "training"],
  ["DuckAssistBot/1.2", "duckassistbot", "DuckAssistBot", "DuckDuckGo", "realtime_citation"],
  ["DuckDuckBot/1.0", "duckduckbot", "DuckDuckBot", "DuckDuckGo", "search_indexing"],
  ["Amazonbot/0.1", "amazonbot", "Amazonbot", "Amazon", "training"],
  ["Amzn-SearchBot/0.1", "amzn-searchbot", "Amzn-SearchBot", "Amazon", "search_indexing"],
  ["Amzn-User/0.1", "amzn-user", "Amzn-User", "Amazon", "realtime_citation"],
  ["Meta-WebIndexer/1.1", "meta-webindexer", "Meta-WebIndexer", "Meta", "search_indexing"],
  ["Meta-ExternalFetcher/1.1", "meta-externalfetcher", "Meta-ExternalFetcher", "Meta", "realtime_citation"],
  ["Meta-ExternalAgent/1.1", "meta-externalagent", "Meta-ExternalAgent", "Meta", "training"],
  ["Meta-ExternalAds/1.1", "meta-externalads", "Meta-ExternalAds", "Meta", "other"],
  ["FacebookExternalHit/1.1", "facebookexternalhit", "FacebookExternalHit", "Meta", "other"],
  ["CCBot/2.0", "ccbot", "CCBot", "Common Crawl", "training"],
  ["Bytespider/1.0", "bytespider", "Bytespider", "ByteDance", "training"],
  ["YouBot/1.0", "youbot", "YouBot", "You.com", "search_indexing"],
  ["cohere-ai", "cohere-ai", "cohere-ai", "Cohere", "training"],
  ["MistralAI-User/1.0", "mistralai-user", "MistralAI-User", "Mistral AI", "realtime_citation"],
];

test("classifies the approved bot registry", () => {
  for (const [ua, botId, botName, vendor, purpose] of cases) {
    assert.deepEqual(classifyAiBot(ua), {
      botId,
      botName,
      vendor,
      purpose,
    });
  }
});

test("uses specific patterns before parent bot patterns", () => {
  assert.equal(classifyAiBot("Googlebot-Image/1.0")?.botId, "googlebot-image");
  assert.equal(classifyAiBot("Applebot-Extended/1.0")?.purpose, "training");
});

test("uses other only for generic crawler signals and ignores browsers", () => {
  assert.equal(classifyAiBot("ExampleSpider/1.0")?.purpose, "other");
  assert.equal(classifyAiBot("Mozilla/5.0 Chrome/126"), null);
  assert.equal(classifyAiBot(null), null);
});
