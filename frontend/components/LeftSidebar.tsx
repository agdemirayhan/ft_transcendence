"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "../app/i18n";

export default function LeftSidebar() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="cardTitle">{t("home.shortcuts")}</div>
      <div className="list">
        <button className="linkBtn" type="button" onClick={() => router.push("/home")}>{t("home.feed")}</button>
        <button className="linkBtn" type="button">{t("home.explore")}</button>
        <button className="linkBtn" type="button" onClick={() => router.push("/messages")}>{t("home.messages")}</button>
        <button className="linkBtn" type="button" onClick={() => router.push("/settings")}>{t("home.settings")}</button>
      </div>
    </div>
  );
}
