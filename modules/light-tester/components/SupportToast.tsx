"use client";

import { useState, useEffect } from "react";

const SNOOZE_MS = 24 * 60 * 60 * 1000;

export function shouldShowSupport() {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("lt_supported")) return false;
  const snoozed = localStorage.getItem("lt_snoozed");
  if (snoozed && Date.now() - Number(snoozed) < SNOOZE_MS) return false;
  return true;
}

export function SupportToast({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const hide = (cb: () => void) => {
    setVisible(false);
    setTimeout(cb, 320);
  };

  const openBMC = () => {
    window.open("https://buymeacoffee.com/guth", "bmc", "width=500,height=650,scrollbars=yes");
    localStorage.setItem("lt_supported", "1");
    hide(onDismiss);
  };

  const snooze = () => {
    localStorage.setItem("lt_snoozed", String(Date.now()));
    hide(onDismiss);
  };

  return (
    <div className={`lt-support-toast${visible ? " lt-support-toast--in" : ""}`}>
      <p className="lt-support-text">
        Light Tester je zdarma a vždy bude. Stál ale dost času a zkušeností.
        Pokud ti pomohl, budu rád za příspěvek.
      </p>
      <div className="lt-support-actions">
        <button className="lt-btn lt-btn-primary" onClick={openBMC}>☕ Přispět</button>
        <button className="lt-btn lt-btn-ghost" onClick={snooze}>Příště</button>
      </div>
    </div>
  );
}
