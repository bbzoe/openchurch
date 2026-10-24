"use client";

import { useMemo, useState } from "react";
import { createChurch } from "@/server/actions";
import { Button } from "@/components/ui/button";
import {
  denominationBySlug,
  denominationsForCountry,
  listCountries,
  otherDenomination,
  traditionOrder,
} from "@/data/community";

export function ChurchForm() {
  const countries = useMemo(() => listCountries(), []);
  const [country, setCountry] = useState("PL");
  const [slug, setSlug] = useState("pl-pentecostal");
  const grouped = denominationsForCountry(country);
  const widerByTradition = traditionOrder
    .map((tradition) => ({
      tradition,
      items: grouped.wider.filter((item) => item.tradition === tradition),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <form action={createChurch} className="grid gap-3 rounded-[22px] border border-line bg-white p-6">
      <h2 className="text-lg font-semibold">Register a church</h2>
      <p className="text-sm text-body">
        Name the community, then the church body it belongs to. If the body is missing, choose Other and type the official name.
      </p>
      <label className="grid gap-1 text-sm font-medium">
        Church name
        <input name="name" required className="h-11 rounded-xl border border-line px-3" placeholder="KZ Nowa Nadzieja Poznań" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Country
        <select
          name="country"
          required
          value={country}
          onChange={(event) => {
            const next = event.target.value;
            setCountry(next);
            const nextGroups = denominationsForCountry(next);
            const stillValid =
              slug === otherDenomination ||
              nextGroups.local.some((item) => item.slug === slug) ||
              nextGroups.wider.some((item) => item.slug === slug);
            if (!stillValid) setSlug(nextGroups.local[0]?.slug ?? nextGroups.wider[0]?.slug ?? otherDenomination);
          }}
          className="h-11 rounded-xl border border-line bg-white px-3"
        >
          {countries.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        City
        <input name="city" required className="h-11 rounded-xl border border-line px-3" placeholder="Poznań" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Denomination
        <select
          name="denomination"
          required
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="h-11 rounded-xl border border-line bg-white px-3"
        >
          {grouped.local.length > 0 ? (
            <optgroup label="In this country">
              {grouped.local.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {widerByTradition.map((group) => (
            <optgroup key={group.tradition} label={group.tradition}>
              {group.items.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ))}
          <optgroup label="Not listed">
            <option value={otherDenomination}>Other</option>
          </optgroup>
        </select>
      </label>
      {slug === otherDenomination ? (
        <label className="grid gap-1 text-sm font-medium">
          Official name of the church body
          <input name="denominationCustom" required className="h-11 rounded-xl border border-line px-3" />
        </label>
      ) : (
        <p className="text-xs text-body">{denominationBySlug(slug)?.tradition}</p>
      )}
      <Button className="h-11 w-fit rounded-full px-5 font-semibold">Create church</Button>
    </form>
  );
}
