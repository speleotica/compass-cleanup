import * as React from 'react'
import 'react-virtualized/styles.css'
import { Theme, withStyles, TextField, InputAdornment, Button } from '@material-ui/core'
import buildNameCorrectionStats, {
  NameCorrectionStats,
  NameCorrectionStat
} from '../../buildNameCorrectionStats'
import { AutoSizer, Column, Table } from 'react-virtualized'
import {
  defaultRowRenderer,
  TableRowProps,
  TableCellProps,
  TableCellDataGetterParams
} from 'react-virtualized/dist/es/Table'
import classNames from 'classnames'
import SearchIcon from '@material-ui/icons/Search'
import Trie from '../../Trie'
import { WithStyles, createStyles } from '@material-ui/styles'
import { ProjectState } from '../reducers/project'
import { Link } from 'react-router-dom'
import { Map as iMap } from 'immutable'
import { sortBy } from 'lodash/fp'

const styles = (theme: Theme) =>
  createStyles({
    root: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column'
    },
    content: {
      flex: '1 1 auto'
    },
    controls: {
      display: 'flex',
      flexWrap: 'nowrap',
      alignItems: 'baseline'
    },
    spacer: {
      flex: '1 1 auto'
    },
    options: {
      flex: '0 0 auto',
      margin: theme.spacing(1)
    },
    buttons: {
      flex: '0 0 auto'
    },
    columnHeader: {
      fontFamily: theme.typography.h6.fontFamily,
      textTransform: 'initial'
    },
    countColumn: {
      textAlign: 'right',
      marginRight: theme.spacing(3)
    },
    tableRow: {
      fontFamily: 'monospace',
      fontWeight: 'bold'
    },
    tableRowOdd: {
      backgroundColor: theme.palette.grey[100]
    },
    replacementInput: {
      fontFamily: 'monospace',
      fontWeight: 'bold'
    }
  })

interface Props extends WithStyles<typeof styles> {
  project: ProjectState
}

const CorrectNamesView = ({ project, classes }: Props) => {
  const [search, setSearch] = React.useState('')
  const [allScrollTop, setAllScrollTop] = React.useState(0)
  const handleAllScroll = React.useCallback(
    ({ scrollTop }) => {
      setAllScrollTop(scrollTop)
    },
    [setAllScrollTop]
  )
  const handleSearchChange = React.useCallback(event => setSearch(event.target.value), [setSearch])

  const nameCorrectionStats = React.useMemo<NameCorrectionStats>(() => {
    if (!project) return new Map()
    return buildNameCorrectionStats(project.data)
  }, [project])
  const [replacements, setReplacements] = React.useReducer(
    (state: iMap<string, string>, action: Record<string, string>) => state.merge(action),
    iMap<string, string>(
      [...nameCorrectionStats.values()].map(({ original, suggested }) => [
        original,
        suggested || ''
      ])
    )
  )

  const allRows = React.useMemo<NameCorrectionStat[]>(
    () => sortBy<NameCorrectionStat>(['original'])([...nameCorrectionStats.values()]),
    [nameCorrectionStats]
  )

  const searchTrie = React.useMemo<Trie<NameCorrectionStat[]>>((): Trie<NameCorrectionStat[]> => {
    const result: Trie<NameCorrectionStat[]> = new Trie()
    for (const stat of allRows) {
      const fullNode = result.insert(stat.original.toLowerCase())
      if (!fullNode.data) fullNode.data = []
      fullNode.data.push(stat)

      const parts = stat.original.split(/\s+/g)
      for (const part of parts) {
        const partNode = result.insert(part.toLowerCase())
        if (!partNode.data) partNode.data = []
        partNode.data.push(stat)
      }
    }
    return result
  }, [allRows])

  const searchedRows = React.useMemo((): NameCorrectionStat[] => {
    if (!search) return allRows
    const normalized = search.toLowerCase().replace(/\s+/g, ' ')
    const result: NameCorrectionStat[] = []
    const maxDist = Math.ceil(normalized.length / 8)
    for (const {
      node: { data }
    } of Object.values(searchTrie.search(normalized, maxDist))) {
      if (data) data.forEach(stat => result.push(stat))
    }
    return result
  }, [search, searchTrie, allRows])

  const rowGetter = React.useCallback(({ index }) => searchedRows[index], [searchedRows])
  const rowRenderer = React.useCallback(
    ({ index, className, ...params }: TableRowProps): React.ReactNode =>
      defaultRowRenderer({
        ...params,
        index,
        className: classNames(className, classes.tableRow, { [classes.tableRowOdd]: index % 2 })
      }),
    []
  )
  const countGetter = React.useCallback(
    ({ rowData, dataKey }: TableCellDataGetterParams): any => {
      const stats = nameCorrectionStats.get(rowData[dataKey])
      return stats ? stats.count : 0
    },
    [nameCorrectionStats]
  )
  const replacementRenderer = React.useCallback(
    ({ cellData }: TableCellProps): React.ReactNode => {
      const value = replacements.get(cellData)
      return (
        <TextField
          inputProps={{ className: classes.replacementInput }}
          InputProps={{ disableUnderline: true }}
          type="text"
          value={value}
          onChange={event => setReplacements({ [cellData]: event.target.value })}
          fullWidth
        />
      )
    },
    [replacements, classes]
  )
  const replacementCountGetter = React.useCallback(
    ({ rowData, dataKey }: TableCellDataGetterParams): any => {
      const replacement = replacements.get(rowData[dataKey])
      if (!replacement) return null
      const stats = nameCorrectionStats.get(replacement)
      return stats ? stats.count : 0
    },
    [nameCorrectionStats, replacements]
  )

  return (
    <div className={classes.root}>
      <div className={classes.controls}>
        <div className={classes.options}>
          <TextField
            type="text"
            placeholder="Search"
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </div>
        <div className={classes.spacer} />
        <div className={classes.buttons}>
          <Button variant="text" component={Link} to="/">
            Cancel
          </Button>
        </div>
      </div>
      <div className={classes.content}>
        <AutoSizer>
          {({ width, height }) => (
            <Table
              width={width}
              height={height}
              headerHeight={40}
              rowCount={searchedRows.length}
              rowGetter={rowGetter}
              rowRenderer={rowRenderer}
              rowHeight={40}
              scrollTop={!search ? allScrollTop : undefined}
              onScroll={!search ? handleAllScroll : undefined}
            >
              <Column
                label="Original Name"
                dataKey="original"
                width={200}
                flexGrow={1}
                headerClassName={classes.columnHeader}
              />
              <Column
                label="Count"
                className={classes.countColumn}
                headerClassName={classNames(classes.columnHeader, classes.countColumn)}
                dataKey="original"
                width={75}
                cellDataGetter={countGetter}
              />
              <Column
                label="Replacement"
                dataKey="original"
                width={200}
                flexGrow={1}
                headerClassName={classes.columnHeader}
                cellRenderer={replacementRenderer}
              />
              <Column
                label="Count"
                className={classes.countColumn}
                headerClassName={classNames(classes.columnHeader, classes.countColumn)}
                dataKey="original"
                cellDataGetter={replacementCountGetter}
                width={75}
              />
            </Table>
          )}
        </AutoSizer>
      </div>
    </div>
  )
}
export default withStyles(styles)(CorrectNamesView)
