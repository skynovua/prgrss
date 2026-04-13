"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const STORAGE_KEY = "prgrss:autoRestTimer";

export function getAutoRestTimer(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function WorkoutSettings() {
  const [autoTimer, setAutoTimer] = useState(true);

  useEffect(() => {
    setAutoTimer(getAutoRestTimer());
  }, []);

  function handleChange(checked: boolean) {
    setAutoTimer(checked);
    localStorage.setItem(STORAGE_KEY, String(checked));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тренування</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Таймер відпочинку</p>
            <p className="text-muted-foreground text-xs">Автоматично показувати після підходу</p>
          </div>
          <Switch checked={autoTimer} onCheckedChange={handleChange} />
        </div>
      </CardContent>
    </Card>
  );
}
