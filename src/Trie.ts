export default class Trie<Data = undefined> {
  size: number
  word?: string
  children: Map<string, Trie<Data>> = new Map()
  data?: Data

  constructor() {
    this.size = 0
  }
  /**
   * Inserts a word into the Trie.
   *
   * @param{string} word - the word to insert
   *
   * @returns{Trie} the inserted (or existing) node corresponding to the word
   */
  insert(word: string): Trie<Data> {
    let node: Trie<Data> = this
    for (var i = 0; i < word.length; i++) {
      const letter = word.charAt(i)
      let child = node.children.get(letter)
      if (!child) node.children.set(letter, (child = new Trie()))
      node = child
    }
    if (node.word !== word) {
      node.word = word
      this.size++
    }
    return node
  }

  /**
   * Helper function for search.
   *
   * @param{string}   letter - the letter to search for at this node
   * @param{string}   word - the full word you're searching for
   * @param{number[]} previousRow - the previous row of the Levenshtein algorithm
   * @param{object}   results - object to put the results into (key is word, value is {node, dist})
   * @param{number}   maxDist - will bail on tree paths whose Levenshtein distance is greater than maxDist
   */
  private searchRecursive(
    letter: string,
    word: string,
    previousRow: number[],
    results: Record<string, { node: Trie<Data>; dist: number }>,
    maxDist: number
  ) {
    const lastColumn = word.length
    let currentRow = [previousRow[0] + 1]

    for (var column = 1; column <= lastColumn; column++) {
      const insertDist = currentRow[column - 1] + 1
      const deleteDist = previousRow[column] + 1
      const replaceDist =
        word.charAt(column - 1) === letter ? previousRow[column - 1] : previousRow[column - 1] + 1

      currentRow[column] = Math.min(insertDist, deleteDist, replaceDist)
    }

    if (currentRow[lastColumn] <= maxDist && this.word) {
      results[this.word] = { node: this, dist: currentRow[lastColumn] }
    }

    if (Math.min.apply(undefined, currentRow) <= maxDist) {
      for (const [letter, child] of this.children.entries()) {
        child.searchRecursive(letter, word, currentRow, results, maxDist)
      }
    }
  }

  /**
   * Searches for all words with Levenshtein distance <= maxDist from the given word.
   *
   * @param{string} word - the word to search for
   * @param{number} maxDist - the maximum Levenshtein distance to return words for
   *
   * @returns{object} where key is a word from the Trie, and value is {node, dist}.
   */
  search(word: string, maxDist: number): Record<string, { node: Trie<Data>; dist: number }> {
    const currentRow = []
    for (let i = 0; i <= word.length; i++) {
      currentRow[i] = i
    }

    const results = {}

    for (const [letter, child] of this.children.entries()) {
      child.searchRecursive(letter, word, currentRow, results, maxDist)
    }

    return results
  }
}
