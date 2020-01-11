import replaceNamesInDatFile from '../src/replaceNamesInDatFile'
import { Map as iMap } from 'immutable'

describe('replaceNamesInDatFile', () => {
  it('works', () => {
    const data = `
SURVEY TEAM:
foo,bar,baz


SURVEY TEAM:
   glob    glob 



SURVEY TEAM:
baz,qux


    `.replace(/\n/gm, '\r\n')

    expect(
      replaceNamesInDatFile(
        data,
        iMap({
          foo: 'Foo',
          baz: 'BAZ'
        })
      )
    ).toEqual(
      `
SURVEY TEAM:
Foo, bar, BAZ


SURVEY TEAM:
   glob    glob 



SURVEY TEAM:
BAZ, qux


    `.replace(/\n/gm, '\r\n')
    )
  })
})
