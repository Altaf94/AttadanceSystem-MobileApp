import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { COLORS } from '../constants';

interface DateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDateTime: (date: Date) => void;
  initialDate?: Date;
  dateOnly?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  visible,
  onClose,
  onSelectDateTime,
  initialDate,
  dateOnly = false,
}) => {
  const now = new Date();
  const currentDate = initialDate || new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [hours, setHours] = useState(initialDate?.getHours() || 12);
  const [minutes, setMinutes] = useState(initialDate?.getMinutes() || 0);
  const [ampm, setAmpm] = useState(initialDate && initialDate.getHours() >= 12 ? 'PM' : 'AM');

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const rows = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }

    const isToday = (day: number | null) => {
      if (!day) return false;
      const today = new Date();
      return (
        day === today.getDate() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getFullYear() === today.getFullYear()
      );
    };

    const isSelected = (day: number | null) => {
      if (!day) return false;
      return (
        day === selectedDate.getDate() &&
        selectedDate.getMonth() === selectedDate.getMonth() &&
        selectedDate.getFullYear() === selectedDate.getFullYear()
      );
    };

    return (
      <View style={styles.calendar}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => {
              setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
            }}
          >
            <Text style={styles.navButton}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>{getMonthName(selectedDate)}</Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
            }}
          >
            <Text style={styles.navButton}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <Text key={i} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>

        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.calendarRow}>
            {row.map((day, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.dayCell,
                  isToday(day) && styles.todayCell,
                  isSelected(day) && styles.selectedCell,
                  !day && styles.emptyCell,
                ]}
                onPress={() => {
                  if (day) {
                    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day));
                  }
                }}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday(day) && styles.todayText,
                    isSelected(day) && styles.selectedText,
                    !day && styles.emptyText,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.calendarFooter}>
          <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
            <Text style={styles.todayButton}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTimePicker = () => {
    const hoursArray = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutesArray = Array.from({ length: 60 }, (_, i) => i);

    return (
      <View style={styles.timePicker}>
        <View style={styles.timeColumn}>
          <Text style={styles.timeLabel}>Hour</Text>
          <ScrollView
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            style={styles.timeScroll}
          >
            {hoursArray.map((hour) => (
              <TouchableOpacity
                key={hour}
                style={[styles.timeItem, hours === hour && styles.selectedTimeItem]}
                onPress={() => setHours(hour)}
              >
                <Text
                  style={[
                    styles.timeText,
                    hours === hour && styles.selectedTimeText,
                  ]}
                >
                  {String(hour).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.timeColumn}>
          <Text style={styles.timeLabel}>Minute</Text>
          <ScrollView
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            style={styles.timeScroll}
          >
            {minutesArray.map((minute) => (
              <TouchableOpacity
                key={minute}
                style={[styles.timeItem, minutes === minute && styles.selectedTimeItem]}
                onPress={() => setMinutes(minute)}
              >
                <Text
                  style={[
                    styles.timeText,
                    minutes === minute && styles.selectedTimeText,
                  ]}
                >
                  {String(minute).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.timeColumn}>
          <Text style={styles.timeLabel}>Period</Text>
          <View style={styles.ampmContainer}>
            {['AM', 'PM'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.ampmButton,
                  ampm === period && styles.ampmButtonSelected,
                ]}
                onPress={() => setAmpm(period)}
              >
                <Text
                  style={[
                    styles.ampmText,
                    ampm === period && styles.ampmTextSelected,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate);
    let hour = hours;
    
    if (ampm === 'PM' && hours !== 12) {
      hour += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hour = 0;
    }
    
    finalDate.setHours(hour, minutes, 0, 0);
    onSelectDateTime(finalDate);
    onClose();
  };

  const formatSelectedDateTime = () => {
    const dateStr = selectedDate.toLocaleDateString('en-GB');
    if (dateOnly) {
      return dateStr;
    }
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    return `${dateStr}, ${timeStr}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{dateOnly ? 'Select Date' : 'Select Date & Time'}</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView contentContainerStyle={styles.pickerContainer}>
            {renderCalendar()}
            {!dateOnly && renderTimePicker()}

            <View style={styles.selectedDisplay}>
              <Text style={styles.selectedLabel}>Selected:</Text>
              <Text style={styles.selectedDateTime}>{formatSelectedDateTime()}</Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.gray,
    width: 30,
    textAlign: 'center',
  },
  pickerContainer: {
    padding: 16,
    gap: 20,
  },
  calendar: {
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  navButton: {
    fontSize: 24,
    color: COLORS.primary,
    paddingHorizontal: 16,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDay: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    width: '14.28%',
    textAlign: 'center',
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  todayCell: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectedCell: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  todayText: {
    color: COLORS.primary,
  },
  selectedText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyText: {
    display: 'none',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  todayButton: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  timePicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 16,
    height: 280,
  },
  timeColumn: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 8,
  },
  timeScroll: {
    height: 200,
    flex: 1,
  },
  timeItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 4,
  },
  selectedTimeItem: {
    backgroundColor: COLORS.primary,
  },
  timeText: {
    fontSize: 16,
    color: COLORS.black,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedTimeText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  ampmContainer: {
    gap: 8,
  },
  ampmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  ampmButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ampmText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
    textAlign: 'center',
  },
  ampmTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  selectedDisplay: {
    padding: 12,
    backgroundColor: '#f3f6fb',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  selectedDateTime: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default DateTimePicker;
