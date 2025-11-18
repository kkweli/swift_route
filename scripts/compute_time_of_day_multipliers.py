#!/usr/bin/env python3
"""
Compute time-of-day multipliers from `optimization_logs` and write to
`time_of_day_multipliers` table in Supabase via REST.

Multiplier per hour = median(optimized_time_minutes / baseline_time_minutes)

Requires environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Usage: python scripts/compute_time_of_day_multipliers.py
"""
import os
import json
import statistics
from datetime import datetime
import urllib.request


def fetch_logs(supabase_url, service_key):
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/optimization_logs?select=request_time,baseline_time_minutes,optimized_time_minutes"
    req = urllib.request.Request(endpoint, method='GET')
    req.add_header('apikey', service_key)
    req.add_header('Authorization', f'Bearer {service_key}')
    req.add_header('Accept', 'application/json')

    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode('utf-8')
        return json.loads(body)


def write_multipliers(supabase_url, service_key, multipliers):
    # multipliers: list of dicts [{"hour": int, "multiplier": float}, ...]
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/time_of_day_multipliers?on_conflict=hour"
    data = json.dumps(multipliers).encode('utf-8')
    req = urllib.request.Request(endpoint, data=data, method='POST')
    req.add_header('apikey', service_key)
    req.add_header('Authorization', f'Bearer {service_key}')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Prefer', 'return=representation')

    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode('utf-8')
        return json.loads(body)


def compute_multipliers(rows):
    # rows: list of {request_time, baseline_time_minutes, optimized_time_minutes}
    by_hour = {h: [] for h in range(24)}
    for r in rows:
        try:
            rt = r.get('request_time')
            if not rt:
                continue
            # parse ISO timestamp
            hour = datetime.fromisoformat(rt.replace('Z', '+00:00')).hour
            baseline = float(r.get('baseline_time_minutes') or 0)
            optimized = float(r.get('optimized_time_minutes') or 0)
            if baseline > 0:
                ratio = optimized / baseline if baseline > 0 else 1.0
                by_hour[hour].append(ratio)
        except Exception:
            continue

    multipliers = []
    for h in range(24):
        vals = by_hour[h]
        if not vals:
            mult = 1.0
        else:
            try:
                mult = float(statistics.median(vals))
            except Exception:
                mult = float(sum(vals) / len(vals))
        multipliers.append({"hour": h, "multiplier": round(mult, 3)})

    return multipliers


def main():
    supabase_url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not supabase_url or not service_key:
        print('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment')
        return

    print('Fetching optimization logs...')
    rows = fetch_logs(supabase_url, service_key)
    print(f'Fetched {len(rows)} log rows')

    multipliers = compute_multipliers(rows)
    print('Computed multipliers:')
    print(json.dumps(multipliers, indent=2))

    print('Writing multipliers to Supabase...')
    resp = write_multipliers(supabase_url, service_key, multipliers)
    print('Write response:', resp)


if __name__ == '__main__':
    main()
