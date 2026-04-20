---
name: reddit-scraper
description: Scrapes top posts from a specified subreddit. Use when the user asks to get posts, visualize reddit data, or analyze subreddit content.
---

# Reddit Scraper Skill

This skill provides a way to scrape the top posts from any public subreddit without needing API keys. It uses Reddit's public JSON endpoints.

## When to use this skill
- User asks to "scrape r/n8n" or any other subreddit.
- User wants to analyze Reddit posts.
- User needs data from Reddit for a workflow.

## Usage

Run the provided Python script to fetch data.

```bash
python3 .agent/skills/reddit-scraper/scripts/scrape.py --subreddit [SUBREDDIT_NAME] --limit [NUMBER]
```

## Examples

**Scrape top 10 posts from r/n8n:**
```bash
python3 .agent/skills/reddit-scraper/scripts/scrape.py --subreddit n8n --limit 10
```

**Scrape top 5 posts from r/artificial:**
```bash
python3 .agent/skills/reddit-scraper/scripts/scrape.py --subreddit artificial --limit 5
```

## Resources
- [Script Source](scripts/scrape.py)
