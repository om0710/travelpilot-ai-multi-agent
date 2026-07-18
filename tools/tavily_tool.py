import os
from tavily import TavilyClient

def tavily_search(query: str) -> str:
    """Search the web using Tavily Search API."""
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return "Error: TAVILY_API_KEY is not set."
    
    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(query=query)
        results = response.get("results", [])
        
        if not results:
            return "No search results found."
            
        formatted_results = []
        for r in results[:5]:
            title = r.get("title", "No Title")
            url = r.get("url", "No URL")
            content = r.get("content", "")
            formatted_results.append(f"Title: {title}\nURL: {url}\nContent: {content}\n")
            
        return "\n".join(formatted_results)
    except Exception as e:
        return f"Error running Tavily search: {str(e)}"
