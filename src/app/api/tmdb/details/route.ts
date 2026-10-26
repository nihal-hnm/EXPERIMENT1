import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type'); // 'movie' or 'series'

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const tmdbType = type === 'series' ? 'tv' : 'movie';
  const apiKey = process.env.TMDB_API_KEY;
  const accessToken = process.env.TMDB_ACCESS_TOKEN;

  if (!apiKey && !accessToken) {
    return NextResponse.json(
      { error: 'TMDB API key or Access Token is not configured' },
      { status: 500 }
    );
  }

  try {
    const url = new URL(`https://api.themoviedb.org/3/${tmdbType}/${id}`);
    url.searchParams.set('language', 'en-US');

    if (apiKey) {
      url.searchParams.set('api_key', apiKey);
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();

    let runtimeMinutes = 0;
    let totalEpisodes = 1;

    if (tmdbType === 'movie') {
      runtimeMinutes = Number(data.runtime) || 0;
    } else {
      totalEpisodes = Number(data.number_of_episodes) || 1;
      // TV episode run times may be an array or average
      if (Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0) {
        runtimeMinutes = data.episode_run_time[0];
      } else if (data.last_episode_to_air?.runtime) {
        runtimeMinutes = data.last_episode_to_air.runtime;
      } else {
        runtimeMinutes = 45; // Default standard episode length
      }
    }

    return NextResponse.json({
      id: data.id,
      title: tmdbType === 'movie' ? data.title : data.name,
      runtime_minutes: runtimeMinutes,
      total_episodes: totalEpisodes,
      overview: data.overview || null,
      poster_url: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      vote_average: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
      genres: Array.isArray(data.genres) ? data.genres.map((g: { name: string }) => g.name) : [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

