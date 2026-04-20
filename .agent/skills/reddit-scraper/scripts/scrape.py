import urllib.request
import urllib.error
import argparse
import json
import sys

def scrape_subreddit(subreddit, limit=10, time_filter='all', sort='top'):
    if sort == 'top':
        url = f"https://www.reddit.com/r/{subreddit}/top.json?limit={limit}&t={time_filter}"
    else:
        url = f"https://www.reddit.com/r/{subreddit}/{sort}.json?limit={limit}"
        
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
    }
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                print(f"Error: Failed to fetch data. Status code: {response.status}", file=sys.stderr)
                sys.exit(1)
            
            data = json.loads(response.read().decode('utf-8'))
            posts = []
            
            children = data.get('data', {}).get('children', [])
            for child in children:
                post_data = child.get('data', {})
                posts.append({
                    'title': post_data.get('title'),
                    'url': post_data.get('url'),
                    'score': post_data.get('score'),
                    'author': post_data.get('author'),
                    'num_comments': post_data.get('num_comments'),
                    'created_utc': post_data.get('created_utc')
                })
                
            print(json.dumps(posts, indent=2))
            
    except urllib.error.HTTPError as e:
        if e.code == 429:
            print("Error: Rate limited. Try again later.", file=sys.stderr)
        else:
            print(f"Error: HTTP {e.code} - {e.reason}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Scrape posts from a subreddit')
    parser.add_argument('--subreddit', type=str, required=True, help='Subreddit name to scrape')
    parser.add_argument('--limit', type=int, default=10, help='Number of posts to scrape')
    parser.add_argument('--time', type=str, default='all', choices=['hour', 'day', 'week', 'month', 'year', 'all'], help='Time filter for top posts')
    parser.add_argument('--sort', type=str, default='top', choices=['top', 'new', 'hot', 'rising'], help='Sort order for posts')
    
    args = parser.parse_args()
    scrape_subreddit(args.subreddit, args.limit, args.time, args.sort)
