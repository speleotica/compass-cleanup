import * as React from 'react'
import 'react-virtualized/styles.css'
import {
  Theme,
  withStyles,
  TextField,
  InputAdornment,
  Button,
  Typography,
  IconButton
} from '@material-ui/core'
import buildNameCorrectionStats, {
  NameCorrectionStats,
  NameCorrectionStat
} from '../../buildNameCorrectionStats'
import { AutoSizer, Column, Table } from 'react-virtualized'
import {
  defaultRowRenderer,
  TableRowProps,
  TableCellProps,
  TableCellDataGetterParams,
  RowMouseEventHandlerParams
} from 'react-virtualized/dist/es/Table'
import classNames from 'classnames'
import SearchIcon from '@material-ui/icons/Search'
import CancelIcon from '@material-ui/icons/Cancel'
import Trie from '../../Trie'
import { WithStyles, createStyles } from '@material-ui/styles'
import { ProjectState } from '../redu/project'
import { Link } from 'react-router-dom'
import { Map as iMap } from 'immutable'
import { sortBy } from 'lodash'
import { formatCompassTripHeader } from '@speleotica/compass/dat'

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
      flex: '1 1 auto',
      display: 'flex',
      flexWrap: 'nowrap'
    },
    tableHolder: {
      flex: '1 0 60%'
    },
    trips: {
      flex: '0 0 40%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      marginLeft: theme.spacing(1),
      overflow: 'hidden'
    },
    tripsScroller: {
      flex: '1 1 auto',
      overflow: 'auto'
    },
    controls: {
      flex: '0 0 auto',
      display: 'flex',
      flexWrap: 'nowrap',
      alignItems: 'baseline'
    },
    spacer: {
      flex: '1 1 auto'
    },
    options: {
      flex: '0 0 auto',
      margin: theme.spacing(1),
      '& > :not(:first-child)': {
        marginLeft: theme.spacing(1)
      }
    },
    buttons: {
      margin: theme.spacing(1),
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
      fontWeight: 'bold',
      cursor: 'pointer',
      outline: 'none'
    },
    tableRowOdd: {
      backgroundColor: theme.palette.grey[100]
    },
    selectedRow: {
      color: 'white',
      backgroundColor: theme.palette.primary.main,
      outline: 'none'
    },
    replacementInput: {
      fontFamily: 'monospace',
      fontWeight: 'bold',
      '$selectedRow &': {
        color: 'white'
      }
    }
  })

interface Props extends WithStyles<typeof styles> {
  project: ProjectState
}

const CorrectNamesView = ({ project, classes }: Props) => {
  const [search, setSearch] = React.useState('')
  const searchRef = React.useRef<HTMLInputElement | null>(null)
  const handleClearSearch = React.useCallback(() => {
    setSearch('')
    const searchField = searchRef.current
    if (searchField) searchField.focus()
  }, [setSearch])
  const [hideUnsuspicious, setHideUnsuspicious] = React.useState(false)
  const [allScrollTop, setAllScrollTop] = React.useState(0)
  const [selectedName, setSelectedName] = React.useState<string | null>(null)
  const handleAllScroll = React.useCallback(({ scrollTop }) => setAllScrollTop(scrollTop), [
    setAllScrollTop
  ])
  const handleSearchChange = React.useCallback(event => setSearch(event.target.value), [setSearch])

  const nameCorrectionStats = React.useMemo<NameCorrectionStats>(() => {
    if (!project) return new Map()
    return buildNameCorrectionStats(project.data)
  }, [project])
  const [replacements, setReplacements] = React.useReducer(
    (state: iMap<string, string>, action: Record<string, string>) => state.merge(action),
    iMap<string, string>(
      Array.from(nameCorrectionStats.values()).map(({ original, suggested }) => [
        original,
        suggested || ''
      ])
    )
  )

  const allRows = React.useMemo<NameCorrectionStat[]>(
    () => sortBy(Array.from(nameCorrectionStats.values()), ['original']),
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

  const filteredRows = React.useMemo((): NameCorrectionStat[] => {
    let result = allRows
    if (search) {
      const normalized = search.toLowerCase().replace(/\s+/g, ' ')
      result = []
      const maxDist = Math.ceil(normalized.length / 8)
      for (const {
        node: { data }
      } of Object.values(searchTrie.search(normalized, maxDist))) {
        if (data) data.forEach(stat => result.push(stat))
      }
    }
    if (hideUnsuspicious) {
      result = result.filter(stats => stats.isSuspect)
    }
    return sortBy(result, ['original'])
  }, [hideUnsuspicious, search, searchTrie, allRows])

  const rowGetter = React.useCallback(({ index }) => filteredRows[index], [filteredRows])
  const rowRenderer = React.useCallback(
    ({ index, className, rowData, ...params }: TableRowProps): React.ReactNode =>
      defaultRowRenderer({
        ...params,
        rowData,
        index,
        className: classNames(className, classes.tableRow, {
          [classes.tableRowOdd]: index % 2,
          [classes.selectedRow]: rowData.original === selectedName
        })
      }),
    [selectedName]
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

  const handleRowClick = React.useCallback(
    ({ rowData }: RowMouseEventHandlerParams) => {
      setSelectedName(rowData.original === selectedName ? null : rowData.original)
    },
    [selectedName, setSelectedName]
  )

  const printedTrips = React.useMemo((): string[] => {
    if (!selectedName) return []
    const stats = nameCorrectionStats.get(selectedName)
    if (!stats) return []
    try {
      return stats.trips.map(trip => formatCompassTripHeader(trip.header))
    } catch (error) {
      console.error(error.stack)
      return []
    }
  }, [selectedName, nameCorrectionStats])

  return (
    <div className={classes.root}>
      <div className={classes.controls}>
        <div className={classes.options}>
          <TextField
            type="text"
            placeholder="Search"
            value={search}
            onChange={handleSearchChange}
            inputProps={{ ref: searchRef }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {search ? (
                    <IconButton onClick={handleClearSearch}>
                      <CancelIcon />
                    </IconButton>
                  ) : (
                    <SearchIcon />
                  )}
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setHideUnsuspicious(!hideUnsuspicious)}
          >
            {hideUnsuspicious ? 'Show Unsuspicious Names' : 'Hide Unsuspicious Names'}
          </Button>
        </div>
        <div className={classes.spacer} />
        <div className={classes.buttons}>
          <Button variant="text" component={Link} to="/">
            Cancel
          </Button>
          <Button variant="outlined" color="primary">
            Apply
          </Button>
        </div>
      </div>
      <div className={classes.content}>
        <div className={classes.tableHolder}>
          <AutoSizer>
            {({ width, height }) => (
              <Table
                tabIndex={-1}
                width={width}
                height={height}
                headerHeight={40}
                rowCount={filteredRows.length}
                rowGetter={rowGetter}
                rowRenderer={rowRenderer}
                rowHeight={40}
                scrollTop={!search ? allScrollTop : undefined}
                onScroll={!search ? handleAllScroll : undefined}
                onRowClick={handleRowClick}
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
        {selectedName != null && (
          <div className={classes.trips}>
            <Typography variant="h5">Trips</Typography>
            <div className={classes.tripsScroller}>
              {printedTrips.map((trip, index) => (
                <pre key={index}>{trip}</pre>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default withStyles(styles)(CorrectNamesView)
