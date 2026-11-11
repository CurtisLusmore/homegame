import { useEffect, useReducer, useRef, useState } from 'react';
import {
  Button,
  Grid,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Campaign,
  MusicNote,
  Pause,
  PlayArrow,
  Stop,
  Undo,
} from '@mui/icons-material';
import {
  CssBaseline,
} from './components';

type Team = {
  name: string;
  logo: string;
  song: string;
  disabled?: boolean;
  background: string;
  foreground: string;
}

type Score = {
  goals: number;
  behinds: number;
  total: number;
}

const Quarters = [
  'PG',
  '1ST',
  'QT',
  '2ND',
  'HT',
  '3RD',
  '3QT',
  '4TH',
  'FT',
];

type QuarterState = typeof Quarters[number];

const QuarterDurations: Record<QuarterState, number> = {
  'PG': -1,
  '1ST': 285000,
  'QT': 15000,
  '2ND': 285000,
  'HT': 30000,
  '3RD': 285000,
  '3QT': 15000,
  '4TH': 285000,
  'FT': -1,
};

type GameStateSelecting = {
  status: 'SELECTING';
  homeTeam: Team;
}

type GameStateInProgress = {
  status: 'IN_PROGRESS';
  homeTeam: Team;
  awayTeam: Team;
  homeScore: Score;
  awayScore: Score;
  scores: ScoreAction[];
  quarter: QuarterState;
  startedAt: number;
  time: number;
  paused: boolean;
}

type GameState =
  | GameStateSelecting
  | GameStateInProgress;

const teams: Team[] = [
  { name: 'Adelaide Crows', logo: 'adel.jpg', song: 'adel.mp3', background: '#0f1432', foreground: '#f0ae3c' },
  { name: 'Brisbane Lions', logo: 'bl.jpg', song: 'bl.mp3', background: '#71133f', foreground: '#f4c16a', disabled: true },
  { name: 'Carlton Blues', logo: 'carl.jpg', song: 'carl.mp3', background: '#091f31', foreground: '#ffffff' },
  { name: 'Collingwood Magpies', logo: 'coll.jpg', song: 'coll.mp3', background: '#000000', foreground: '#ffffff' },
  { name: 'Essendon Bombers', logo: 'ess.jpg', song: 'ess.mp3', background: '#000000', foreground: '#ffffff' },
  { name: 'Fremantle Dockers', logo: 'fre.jpg', song: 'fre.mp3', background: '#260e50', foreground: '#fff' },
  { name: 'Gold Coast Suns', logo: 'gcfc.jpg', song: 'gcfc.mp3', background: '#7d1710', foreground: '#f9e26f' },
  { name: 'Geelong Cats', logo: 'geel.jpg', song: 'geel.mp3', background: '#ffffff', foreground: '#0a2243' },
  { name: 'GWS Giants', logo: 'gws.jpg', song: 'gws.mp3', background: '#535051', foreground: '#ed8536' },
  { name: 'Hawthorn Hawks', logo: 'haw.jpg', song: 'haw.mp3', background: '#643f1a', foreground: '#f7cd4e' },
  { name: 'Melbourne Demons', logo: 'melb.jpg', song: 'melb.mp3', background: '#0d192f', foreground: '#cc2c26' },
  { name: 'North Melbourne Kangaroos', logo: 'nmfc.jpg', song: 'nmfc.mp3', background: '#16399a', foreground: '#ffffff' },
  { name: 'Port Adelaide Power', logo: 'port.jpg', song: 'port.mp3', background: '#3d83af', foreground: '#ffffff' },
  { name: 'Richmond Tigers', logo: 'rich.jpg', song: 'rich.mp3', background: '#000000', foreground: '#f4d849' },
  { name: 'St Kilda Saints', logo: 'stk.jpg', song: 'stk.mp3', background: '#000000', foreground: '#ffffff' },
  { name: 'Sydney Swans', logo: 'syd.jpg', song: 'syd.mp3', background: '#ffffff', foreground: '#d03d32' },
  { name: 'Western Bulldogs', logo: 'wb.jpg', song: 'wb.mp3', background: '#2042a6', foreground: '#ffffff' },
  { name: 'West Coast Eagles', logo: 'wce.jpg', song: 'wce.mp3', background: '#183c8f', foreground: '#e6aa3b' },
];

const initialState: GameState = {
  status: 'SELECTING',
  homeTeam: teams[1],
};

type GameStartedAction = {
  type: 'GAME_STARTED';
  awayTeam: Team;
}

type TimeUpdateAction = {
  type: 'TIME_UPDATE';
  ellapsed: number;
  endQuarter?: boolean;
}

type PauseResumeAction = {
  type: 'PAUSE_RESUME';
}

type ScoreAction = {
  type: 'SCORE';
  team: 'home' | 'away';
  score: 'goal' | 'behind';
}

type UndoScoreAction = {
  type: 'UNDO_SCORE';
}

type ResetAction = {
  type: 'RESET';
}

type GameStateAction =
  | GameStartedAction
  | TimeUpdateAction
  | PauseResumeAction
  | ScoreAction
  | UndoScoreAction
  | ResetAction;

function reduce(state: GameState, action: GameStateAction): GameState {
  switch (action.type) {
    case 'GAME_STARTED': {
      if (state.status !== 'SELECTING') throw new Error('Invalid action');
      return {
        ...state,
        awayTeam: action.awayTeam,
        status: 'IN_PROGRESS',
        homeScore: { goals: 0, behinds: 0, total: 0 },
        awayScore: { goals: 0, behinds: 0, total: 0 },
        scores: [],
        quarter: 'PG',
        startedAt: Date.now(),
        time: QuarterDurations['PG'],
        paused: false,
      };
    }

    case 'TIME_UPDATE': {
      if (state.status !== 'IN_PROGRESS') throw new Error('Invalid action');
      const time = state.time - action.ellapsed;
      if (action.endQuarter || time <= 0) {
        const quarter = Quarters[Quarters.indexOf(state.quarter) + 1];
        return {
          ...state,
          quarter,
          startedAt: Date.now(),
          time: QuarterDurations[quarter],
        };
      } else {
        return {
          ...state,
          time: state.time - action.ellapsed,
        };
      }
    }

    case 'PAUSE_RESUME': {
      if (state.status !== 'IN_PROGRESS') throw new Error('Invalid action');
      return {
        ...state,
        paused: !state.paused,
      };
    }

    case 'SCORE': {
      if (state.status !== 'IN_PROGRESS') throw new Error('Invalid action');
      switch (action.team) {
        case 'home':
          return {
            ...state,
            homeScore: addScore(state.homeScore, action.score),
            scores: [ ...state.scores, action ],
          };

        case 'away':
          return {
            ...state,
            awayScore: addScore(state.awayScore, action.score),
            scores: [ ...state.scores, action ],
          };
      }
    }

    case 'UNDO_SCORE': {
      if (state.status !== 'IN_PROGRESS') throw new Error('Invalid action');
      const scores = [ ...state.scores ];
      if (!scores.length) return { ...state };
      const action = scores.pop()!;
      switch (action.team) {
        case 'home':
          return {
            ...state,
            homeScore: removeScore(state.homeScore, action.score),
            scores,
          };

        case 'away':
          return {
            ...state,
            awayScore: removeScore(state.awayScore, action.score),
            scores,
          };
      }
    }

    case 'RESET': {
      return { ...initialState };
    }
  }

  function addScore(score: Score, add: 'goal' | 'behind'): Score {
    switch (add) {
      case 'goal': return { goals: score.goals + 1, behinds: score.behinds, total: score.total + 6 };
      case 'behind': return { goals: score.goals, behinds: score.behinds + 1, total: score.total + 1 };
    }
  };

  function removeScore(score: Score, add: 'goal' | 'behind'): Score {
    switch (add) {
      case 'goal': return { goals: score.goals - 1, behinds: score.behinds, total: score.total - 6 };
      case 'behind': return { goals: score.goals, behinds: score.behinds - 1, total: score.total - 1 };
    }
  };
};

export default function App(): React.ReactElement {
  const [ state, dispatch ] = useReducer(reduce, initialState);

  useEffect(() => {
    let lastTimestamp = performance.now();
    let handle: number;
    function tick(timestamp: DOMHighResTimeStamp): void {
      if (state.status !== 'IN_PROGRESS' || [ 'PG', 'FT' ].includes(state.quarter)) return;
      if (!state.paused) {
        const ellapsed = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        dispatch({ type: 'TIME_UPDATE', ellapsed });
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [ (state as GameStateInProgress).quarter, (state as GameStateInProgress).paused ])

  return (
    <>
      <CssBaseline />
      {state.status === 'SELECTING' && (
        <GameSelect dispatch={dispatch} />
      )}
      {state.status === 'IN_PROGRESS' && (
        <GameInProgress state={state} dispatch={dispatch} />
      )}
    </>
  );
};

function GameSelect({
  dispatch,
}: {
  dispatch: React.ActionDispatch<[action: GameStateAction]>,
}): React.ReactElement {
  function handleClick(team: Team): () => void {
    return function (): void {
      dispatch({ type: 'GAME_STARTED', awayTeam: team });
    };
  };

  return (
    <Grid
      container
      spacing={2}
      columns={{ xs: 3, sm: 6 }}
      sx={{
        left: '50%',
        position: 'fixed',
        top: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        width: { xs: '332px', sm: '680px' },
        maxWidth: '100%',
      }}
    >
      {teams.map(team => (
        <Grid
          key={team.name}
          size={1}
        >
          <button
            title={team.name}
            onClick={handleClick(team)}
            disabled={team.disabled}
            style={{
              border: 0,
              cursor: team.disabled ? 'auto' : 'pointer',
              filter: team.disabled ? 'grayscale(100%)' : 'none',
              padding: 0,
            }}
          >
            <img
              src={team.logo}
              height={100}
              width={100}
            />
          </button>
        </Grid>
      ))}
    </Grid>
  );
};

function GameInProgress({
  state,
  dispatch,
}: {
  state: GameStateInProgress,
  dispatch: React.ActionDispatch<[action: GameStateAction]>,
}): React.ReactElement {
  const audioRef = useRef(new Audio());

  useEffect(() => {
    if (!audioRef.current || state.quarter === 'PG') return;
    audioRef.current.src = 'siren.mp3';
    audioRef.current.play();
    audioRef.current.onended = () => {
      if (state.quarter === 'FT') {
        if (state.homeScore.total > state.awayScore.total) {
          audioRef.current.src = state.homeTeam.song;
        } else if (state.awayScore.total > state.homeScore.total) {
          audioRef.current.src = state.awayTeam.song;
        } else {
          audioRef.current.src = 'draw.mp3';
        }
        audioRef.current.play();
        audioRef.current.onended = null;
      }
    }
  }, [ audioRef, state.quarter ]);

  return (
    <>
      {[ 'PG' ].includes(state.quarter) && (
        <StartGame state={state} dispatch={dispatch} />
      )}
      {[ 'QT', 'HT', '3QT' ].includes(state.quarter) && (
        <StartQuarter dispatch={dispatch} />
      )}
      {[ '1ST', '2ND', '3RD', '4TH' ].includes(state.quarter) && (
        <ScoreButtons state={state} dispatch={dispatch} />
      )}
      {[ 'FT' ].includes(state.quarter) && (
        <ResetButton dispatch={dispatch} />
      )}
      <ScoreBug state={state} />
    </>
  );
};

function StartGame({
  state,
  dispatch,
}: {
  state: GameStateInProgress,
  dispatch: React.ActionDispatch<[action: GameStateAction]>,
}): React.ReactElement {
  const audioRef = useRef(new Audio());
  const [ playing, setPlaying ] = useState<Team | null>(null);

  function handleClick(): void {
    dispatch({ type: 'TIME_UPDATE', ellapsed: 0, endQuarter: true });
  };

  function handleClickSong(team: Team): () => void {
    return function () {
      if (playing === team) {
        audioRef.current.pause();
        setPlaying(null);
      } else {
        setPlaying(team);
        audioRef.current.src = team.song;
        audioRef.current.play();
        audioRef.current.onended = () => setPlaying(null);
      }
    };
  };

  return (
    <Stack
      direction="row"
      spacing={4}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        minWidth: '280px',
      }}
    >
      <IconButton
        size="large"
        onClick={handleClickSong(state.homeTeam)}
        sx={{
          backgroundColor: state.homeTeam.background,
          color: state.homeTeam.foreground,
          '&:hover': { backgroundColor: 'text.primary' }
        }}
      >
        {playing === state.homeTeam ? <Stop /> : <MusicNote />}
      </IconButton>
      <Button
        variant="contained"
        size="large"
        onClick={handleClick}
        startIcon={<Campaign />}
      >
        Start
      </Button>
      <IconButton
        size="large"
        onClick={handleClickSong(state.awayTeam)}
        sx={{
          backgroundColor: state.awayTeam.background,
          color: state.awayTeam.foreground,
          '&:hover': { backgroundColor: 'text.primary' }
        }}
      >
        {playing === state.awayTeam ? <Stop /> : <MusicNote />}
      </IconButton>
    </Stack>
  )
};

function StartQuarter({
  dispatch,
}: {
  dispatch: React.ActionDispatch<[action: GameStateAction]>,
}): React.ReactElement {
  function handleClick(): void {
    dispatch({ type: 'TIME_UPDATE', ellapsed: 0, endQuarter: true });
  };

  return (
    <Stack
      direction="row"
      spacing={4}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
      }}
    >
      <Button
        variant="contained"
        size="large"
        onClick={handleClick}
        startIcon={<Campaign />}
      >
        Start
      </Button>
    </Stack>
  )
};

function ScoreButtons({
  state,
  dispatch,
}: {
  state: GameStateInProgress,
  dispatch: React.ActionDispatch<[action: GameStateAction]>,
}): React.ReactElement {
  function handleClick(team: 'home' | 'away', score: 'goal' | 'behind'): () => void {
    return function (): void {
      dispatch({ type: 'SCORE', team, score });
    };
  };

  function handleClickPause(): void {
    dispatch({ type: 'PAUSE_RESUME' });
  };

  function handleClickUndo(): void {
    dispatch({ type: 'UNDO_SCORE' });
  };

  function handleClickEnd(): void {
    dispatch({ type: 'TIME_UPDATE', ellapsed: 0, endQuarter: true });
  };

  return (
    <Grid
      container
      spacing={2}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
      }}
    >
      <Grid size={4}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleClick('home', 'goal')}
        >
          Goal
        </Button>
      </Grid>
      <Grid size={4} offset={4}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleClick('away', 'goal')}
        >
          Goal
        </Button>
      </Grid>

      <Grid size={4}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleClick('home', 'behind')}
        >
          Behind
        </Button>
      </Grid>
      <Grid size={4}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleClickPause}
          startIcon={state.paused ? <PlayArrow /> : <Pause />}
        >
          {state.paused ? 'Play' : 'Pause'}
        </Button>
      </Grid>
      <Grid size={4}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleClick('away', 'behind')}
        >
          Behind
        </Button>
      </Grid>

      <Grid size={4}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          color="warning"
          onClick={handleClickUndo}
          startIcon={<Undo />}
        >
          Undo
        </Button>
      </Grid>
      <Grid size={4} offset={4}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          color="error"
          onClick={handleClickEnd}
          startIcon={<Campaign />}
        >
          End
        </Button>
      </Grid>
    </Grid>
  );
};

function ResetButton({
  dispatch,
}: {
  dispatch: React.ActionDispatch<[action: GameStateAction]>,
}): React.ReactElement {
  function handleClick(): void {
    dispatch({ type: 'RESET' });
  };

  return (
    <Stack
      direction="row"
      spacing={4}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
      }}
    >
      <Button
        variant="contained"
        size="large"
        onClick={handleClick}
        startIcon={<Undo />}
      >
        Reset
      </Button>
    </Stack>
  )
};

function ScoreBug({
  state,
}: {
  state: GameStateInProgress,
}): React.ReactElement {
  return (
    <Stack
      direction="row"
      sx={{
        height: '50px',
        position: 'absolute',
        left: '50%',
        bottom: '8px',
        transform: 'translateX(-50%)',
      }}
    >
      <Stack
        direction="row"
        spacing="8px"
        style={{
          alignItems: 'center',
          backgroundColor: state.homeTeam.background,
          borderRadius: '8px 0px 0px 8px',
          color: state.homeTeam.foreground,
          paddingRight: '8px',
        }}
      >
        <img
          src={state.homeTeam.logo}
          height={50} width={50}
          style={{ borderRadius: '8px 0px 0px 8px' }}
        />
        <div style={{ textAlign: 'center', width: '2ch' }}>{state.homeScore.goals}</div>
        <div style={{ textAlign: 'center', width: '2ch' }}>{state.homeScore.behinds}</div>
        <div style={{ fontSize: '1.5em', textAlign: 'center', width: '2.5ch' }}>{state.homeScore.total}</div>
      </Stack>
      <Stack
        direction="column"
        style={{
          alignItems: 'center',
          backgroundColor: '#f4dd96',
          color: '#000',
          height: '100%',
          justifyContent: 'center',
          width: '50px',
        }}
      >
        <div>{state.quarter}</div>
        <div>{formatTime(state.time)}</div>
      </Stack>
      <Stack
        direction="row"
        spacing="8px"
        sx={{
          alignItems: 'center',
          backgroundColor: state.awayTeam.background,
          borderRadius: '0px 8px 8px 0px',
          color: state.awayTeam.foreground,
          paddingLeft: '8px',
        }}
      >
        <div style={{ textAlign: 'center', width: '2ch' }}>{state.awayScore.goals}</div>
        <div style={{ textAlign: 'center', width: '2ch' }}>{state.awayScore.behinds}</div>
        <div style={{ fontSize: '1.5em', textAlign: 'center', width: '2.5ch' }}>{state.awayScore.total}</div>

        <img
          src={state.awayTeam.logo}
          height={50} width={50}
          style={{ borderRadius: '0px 8px 8px 0px' }}
        />
      </Stack>
    </Stack>
  );
};

function formatTime(ms: number): string {
  if (ms < 0) return "--:--";
  return new Date(ms + 500).toISOString().substring(14,19);
};
