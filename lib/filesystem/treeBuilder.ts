import type { FileTreeNode, FileMeta } from '../../types'

export function buildFileTree(metas: FileMeta[]): FileTreeNode[] {
  const root: FileTreeNode[] = []
  const map = new Map<string, FileTreeNode>()

  const ignored = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'cache'])

  const sorted = [...metas].sort((a, b) => a.path.localeCompare(b.path))

  for (const meta of sorted) {
    const parts = meta.path.split('/').filter(Boolean)
    if (parts.length === 0) continue
    if (ignored.has(parts[0])) continue

    let current = ''
    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1
      current = current ? `${current}/${parts[i]}` : `/${parts[i]}`

      if (!map.has(current)) {
        if (isLast && meta.type === 'file') {
          map.set(current, {
            path: current,
            name: parts[i],
            type: 'file',
            children: [],
            size: meta.size,
          })
        } else if (!isLast || meta.type === 'directory') {
          map.set(current, {
            path: current,
            name: parts[i],
            type: 'directory',
            children: [],
            expanded: false,
          })
        }
      }
    }
  }

  for (const node of map.values()) {
    const parentPath = node.path.split('/').slice(0, -1).join('/') || '/'
    if (parentPath === '/' || parentPath === '') {
      root.push(node)
    } else {
      const parent = map.get(parentPath)
      if (parent && parent.type === 'directory') {
        parent.children.push(node)
      } else {
        root.push(node)
      }
    }
  }

  sortTree(root)
  return root
}

function sortTree(nodes: FileTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  for (const n of nodes) {
    if (n.children.length > 0) sortTree(n.children)
  }
}

export function flattenTree(nodes: FileTreeNode[]): string[] {
  const result: string[] = []
  for (const n of nodes) {
    result.push(n.path)
    if (n.children.length > 0) {
      result.push(...flattenTree(n.children))
    }
  }
  return result
}

export function findNode(nodes: FileTreeNode[], path: string): FileTreeNode | null {
  for (const n of nodes) {
    if (n.path === path) return n
    if (n.children.length > 0) {
      const found = findNode(n.children, path)
      if (found) return found
    }
  }
  return null
}

export function toggleExpanded(nodes: FileTreeNode[], path: string): FileTreeNode[] {
  return nodes.map(n => {
    if (n.path === path && n.type === 'directory') {
      return { ...n, expanded: !n.expanded }
    }
    if (n.children.length > 0) {
      return { ...n, children: toggleExpanded(n.children, path) }
    }
    return n
  })
}
