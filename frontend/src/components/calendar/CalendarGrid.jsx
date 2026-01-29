import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import Button from '../common/Button';
import styles from './CalendarGrid.module.css';

/**
 * Utilidades para manejar fechas
 */
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

/**
 * Formats a date to YYYY-MM-DD in local time (without timezone issues)
 * For database dates (ISO strings), extracts the date part directly
 * to avoid timezone conversion issues
 */
const formatDateLocal = (date) => {
  // If it's an ISO string (from database), extract the date directly
  // to avoid local time conversion changing the day
  if (typeof date === 'string' && date.includes('T')) {
    return date.split('T')[0];
  }
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Monthly calendar grid component
 */
const CalendarGrid = ({
  currentDate, 
  onDateChange, 
  matches = [], 
  onDayClick,
  onMatchClick 
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate days of the month
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Days from previous month (empty)
    for (let i = 0; i < firstDay; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateLocal(date);
      
      // Filter matches for this day (comparing in local time)
      const dayMatches = matches.filter(match => {
        return formatDateLocal(match.scheduledDate) === dateStr;
      });

      days.push({
        type: 'day',
        day,
        date,
        dateStr,
        matches: dayMatches,
        isToday: dateStr === formatDateLocal(new Date()),
        key: `day-${day}`
      });
    }

    return days;
  }, [year, month, matches]);

  // Navigation
  const goToPreviousMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  // Check if a match is upcoming (in the next 24h)
  const isUpcoming = (match) => {
    const matchDate = new Date(match.scheduledDate);
    const now = new Date();
    const hoursDiff = (matchDate - now) / (1000 * 60 * 60);
    return hoursDiff > 0 && hoursDiff <= 24;
  };

  return (
    <div className={styles.calendar}>
      {/* Header with navigation */}
      <div className={styles.calendarHeader}>
        <Button
          variant="outline"
          size="small"
          onClick={goToPreviousMonth}
          aria-label="Mes anterior"
        >
          <MdChevronLeft />
        </Button>

        <div className={styles.calendarTitle}>
          <h2>{MONTHS[month]} {year}</h2>
          <Button
            variant="ghost"
            size="small"
            onClick={goToToday}
            className={styles.todayButton}
          >
            Hoy
          </Button>
        </div>

        <Button
          variant="outline"
          size="small"
          onClick={goToNextMonth}
          aria-label="Mes siguiente"
        >
          <MdChevronRight />
        </Button>
      </div>

      {/* Días de la semana */}
      <div className={styles.weekDays}>
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      {/* Cuadrícula de días */}
      <div className={styles.daysGrid}>
        {calendarDays.map(dayData => {
          if (dayData.type === 'empty') {
            return <div key={dayData.key} className={styles.emptyDay} />;
          }

          const { day, date, matches: dayMatches, isToday } = dayData;

          return (
            <div
              key={dayData.key}
              className={`${styles.dayCell} ${isToday ? styles.today : ''}`}
              onClick={() => onDayClick && onDayClick(date)}
            >
              <div className={styles.dayNumber}>{day}</div>
              
              {/* Lista de partidas del día */}
              {dayMatches.length > 0 && (
                <div className={styles.matchesList}>
                  {dayMatches.slice(0, 3).map(match => {
                    const upcoming = isUpcoming(match);
                    return (
                      <div
                        key={match._id}
                        className={`${styles.matchItem} ${upcoming ? styles.upcoming : ''} ${styles[match.status]}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMatchClick && onMatchClick(match);
                        }}
                        title={match.game?.name || 'Partida'}
                      >
                        <div className={styles.matchTime}>
                          {new Date(match.scheduledDate).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className={styles.matchName}>
                          {match.game?.name || 'Sin juego'}
                        </div>
                        {upcoming && <span className={styles.upcomingBadge}>🔔</span>}
                      </div>
                    );
                  })}
                  {dayMatches.length > 3 && (
                    <div className={styles.moreMatches}>
                      +{dayMatches.length - 3} más
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBadge} ${styles.programada}`}></span>
          <span>Programada</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBadge} ${styles.upcoming}`}></span>
          <span>Próxima (24h) 🔔</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBadge} ${styles.en_curso}`}></span>
          <span>En curso</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBadge} ${styles.finalizada}`}></span>
          <span>Finalizada</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBadge} ${styles.cancelada}`}></span>
          <span>Cancelada</span>
        </div>
      </div>
    </div>
  );
};

CalendarGrid.propTypes = {
  currentDate: PropTypes.instanceOf(Date).isRequired,
  onDateChange: PropTypes.func.isRequired,
  matches: PropTypes.arrayOf(PropTypes.object),
  onDayClick: PropTypes.func,
  onMatchClick: PropTypes.func
};

export default CalendarGrid;
