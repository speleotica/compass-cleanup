import * as React from 'react'
import 'react-virtualized/styles.css'
import {
  Theme,
  withStyles,
  TextField,
  InputAdornment,
  Button,
  Typography,
  IconButton,
  Checkbox
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
import { ProjectState } from '../redux/project'
import { Map as iMap } from 'immutable'
import { sortBy } from 'lodash'
import { formatCompassTripHeader } from '@speleotica/compass/dat'
import _useViewState from '../redux/useViewState'
import { useWithProgress } from './WithProgressContext'
import replaceNamesForMakFile from '../../replaceNamesForMakFile'
import { useSelector } from 'react-redux'
import { RootState } from '../redux'

const useViewState = _useViewState('CorrectNames')

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
    tripsTitle: {
      flex: '0 0 auto',
      display: 'flex',
      alignItems: 'center'
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
      backgroundColor: theme.palette.primary.light,
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

const rowHeight = 40

const CorrectNamesView = ({ project, classes }: Props) => {
  const [search, setSearch] = useViewState<string>('search', '')
  const searchRef = React.useRef<HTMLInputElement | null>(null)
  const handleClearSearch = React.useCallback(() => {
    setSearch('')
    const searchField = searchRef.current
    if (searchField) searchField.focus()
  }, [setSearch])
  const [hideUnsuspicious, setHideUnsuspicious] = useViewState<boolean>('hideUnsuspicious', false)
  const [allScrollTop, setAllScrollTop] = useViewState<number>('allScrollTop', 0)
  const [onlySuspiciousScrollTop, setOnlySuspiciousScrollTop] = useViewState<number>(
    'onlySuspiciousScrollTop',
    0
  )
  const [selectedName, setSelectedName] = useViewState<string | null>('selectedName', null)
  const scrollTop = search ? undefined : hideUnsuspicious ? onlySuspiciousScrollTop : allScrollTop
  const handleScroll = React.useCallback(
    ({ scrollTop }) => {
      if (search) return
      if (hideUnsuspicious) setOnlySuspiciousScrollTop(scrollTop)
      else setAllScrollTop(scrollTop)
    },
    [setAllScrollTop, setOnlySuspiciousScrollTop, hideUnsuspicious, search]
  )
  const handleSearchChange = React.useCallback(event => setSearch(event.target.value), [setSearch])

  const nameCorrectionStats = React.useMemo<NameCorrectionStats>(() => {
    if (!project) return new Map()
    return buildNameCorrectionStats(project.data)
  }, [project])
  const [replacements, setReplacements] = useViewState<iMap<string, string>>('replacements', () =>
    iMap<string, string>(
      Array.from(nameCorrectionStats.values()).map(({ original, suggested }) => [
        original,
        suggested || ''
      ])
    )
  )
  const [enabledReplacements, setEnabledReplacements] = useViewState<iMap<string, boolean>>(
    'enabledReplacements',
    () => replacements.map(Boolean)
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
  const enabledHeaderRenderer = React.useCallback(
    (): React.ReactNode => (
      <Checkbox
        checked={enabledReplacements.find(enabled => enabled === true) || false}
        color="primary"
        onChange={event => {
          setEnabledReplacements(event.target.checked ? replacements.map(Boolean) : iMap())
        }}
      />
    ),
    [replacements, enabledReplacements, setEnabledReplacements]
  )
  const enabledRenderer = React.useCallback(
    ({ cellData }: TableCellProps): React.ReactNode => (
      <Checkbox
        checked={enabledReplacements.get(cellData) || false}
        color="primary"
        onClick={event => {
          event.stopPropagation()
        }}
        onChange={event => {
          setEnabledReplacements(enabledReplacements.set(cellData, event.target.checked))
        }}
      />
    ),
    [enabledReplacements, setEnabledReplacements]
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
          InputProps={{
            disableUnderline: true,
            endAdornment: value ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={event => {
                    event.stopPropagation()
                    setReplacements(replacements.set(cellData, ''))
                    setEnabledReplacements(enabledReplacements.set(cellData, false))
                  }}
                >
                  <CancelIcon />
                </IconButton>
              </InputAdornment>
            ) : (
              undefined
            )
          }}
          type="text"
          value={value}
          onClick={event => {
            event.stopPropagation()
          }}
          onChange={event => {
            setReplacements(replacements.set(cellData, event.target.value))
            const enabled = Boolean(event.target.value)
            if (enabledReplacements.get(cellData) !== enabled) {
              setEnabledReplacements(enabledReplacements.set(cellData, enabled))
            }
          }}
          fullWidth={true}
        />
      )
    },
    [replacements, setReplacements, enabledReplacements, setEnabledReplacements, classes]
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
      return stats.trips.map(trip =>
        formatCompassTripHeader(trip.header, { includeColumnHeaders: false })
      )
    } catch (error) {
      console.error(error.stack)
      return []
    }
  }, [selectedName, nameCorrectionStats])

  const withProgress = useWithProgress()

  const makFile = useSelector((state: RootState) => state.project && state.project.file)

  const handleApply = React.useCallback(() => {
    if (!makFile) return
    withProgress(task =>
      replaceNamesForMakFile(
        makFile,
        replacements.filter((value, key) => value && enabledReplacements.get(key)),
        task
      )
    )
  }, [withProgress, replacements, enabledReplacements])

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
          <Button variant="outlined" color="primary" onClick={handleApply}>
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
                headerHeight={rowHeight}
                rowCount={filteredRows.length}
                rowGetter={rowGetter}
                rowRenderer={rowRenderer}
                rowHeight={rowHeight}
                scrollTop={scrollTop}
                onScroll={handleScroll}
                onRowClick={handleRowClick}
              >
                <Column
                  label=""
                  dataKey="original"
                  width={50}
                  headerRenderer={enabledHeaderRenderer}
                  cellRenderer={enabledRenderer}
                />
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
            <Typography variant="h5" className={classes.tripsTitle}>
              Trips: {selectedName}
              <div className={classes.spacer} />
              <IconButton onClick={() => setSelectedName(null)}>
                <CancelIcon />
              </IconButton>
            </Typography>
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
