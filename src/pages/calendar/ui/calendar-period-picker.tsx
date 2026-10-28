import { X } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  FieldGroup,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

import { CALENDAR_MIN_YEAR, CALENDAR_MONTHS, parseCalendarDate } from "../model/calendar";

interface CalendarPeriodPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateKey: string;
  todayKey: string;
  onSelect: (date: string) => void;
}

function MonthPickerForm({
  dateKey,
  todayKey,
  onSelect,
}: Pick<CalendarPeriodPickerProps, "dateKey" | "todayKey" | "onSelect">) {
  const current = parseCalendarDate(dateKey)!;
  const today = parseCalendarDate(todayKey)!;
  const [year, setYear] = useState(current.getFullYear());
  const [month, setMonth] = useState(current.getMonth());
  const years = Array.from({ length: today.getFullYear() - CALENDAR_MIN_YEAR + 1 }, (_, index) => ({
    value: today.getFullYear() - index,
    label: String(today.getFullYear() - index),
  }));
  const months = CALENDAR_MONTHS.map((label, value) => ({ value, label }));

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const last = new Date(year, month + 1, 0).getDate();
        const day = Math.min(
          current.getDate(),
          last,
          year === today.getFullYear() && month === today.getMonth() ? today.getDate() : last
        );
        onSelect(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
      }}
    >
      <FieldGroup className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="calendar-month">Місяць</FieldLabel>
          <Select
            items={months}
            value={month}
            onValueChange={(value) => {
              if (value != null) setMonth(value);
            }}
          >
            <SelectTrigger id="calendar-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {months.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    disabled={year === today.getFullYear() && item.value > today.getMonth()}
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="calendar-year">Рік</FieldLabel>
          <Select
            items={years}
            value={year}
            onValueChange={(value) => {
              if (value == null) return;
              setYear(value);
              if (value === today.getFullYear() && month > today.getMonth())
                setMonth(today.getMonth());
            }}
          >
            <SelectTrigger id="calendar-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {years.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <Button type="submit">Перейти до місяця</Button>
    </form>
  );
}

export function CalendarPeriodPicker({
  open,
  onOpenChange,
  dateKey,
  todayKey,
  onSelect,
}: CalendarPeriodPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent showCloseButton={false}>
          <DialogHeader className="pr-8">
            <DialogTitle>Обрати місяць</DialogTitle>
            <DialogDescription>
              Переглядай тренування за будь-який минулий місяць.
            </DialogDescription>
          </DialogHeader>
          <MonthPickerForm
            dateKey={dateKey}
            todayKey={todayKey}
            onSelect={(date) => {
              onSelect(date);
              onOpenChange(false);
            }}
          />
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3"
                aria-label="Закрити"
              />
            }
          >
            <X />
          </DialogClose>
        </DialogContent>
      )}
    </Dialog>
  );
}
