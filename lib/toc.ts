import GithubSlugger from 'github-slugger'

export interface TocItem {
  id: string
  text: string
  level: number
}

export function extractTocFromMarkdown(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const headingRegex = /^(#{1,3})\s+(.+)$/gm
  const items: TocItem[] = []

  let match
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = slugger.slug(text)
    items.push({ id, text, level })
  }

  return items
}
