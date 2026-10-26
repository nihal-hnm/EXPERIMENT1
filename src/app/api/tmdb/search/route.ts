import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.TMDB_API_KEY;
  const accessToken = process.env.TMDB_ACCESS_TOKEN;

  if (!apiKey && !accessToken) {
    return NextResponse.json(
      { error: 'TMDB API key or Access Token is not configured in .env.local', results: [] },
      { status: 500 }
    );
  }

  try {
    const url = new URL('https://api.themoviedb.org/3/search/multi');
    url.searchParams.set('query', query);
    url.searchParams.set('include_adult', 'false');
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
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText, results: [] }, { status: res.status });
    }

    const data = await res.json();

    interface RawTmdbItem {
      id: number;
      media_type: string;
      title?: string;
      name?: string;
      poster_path?: string | null;
      release_date?: string;
      first_air_date?: string;
      vote_average?: number;
      overview?: string;
    }

    const results = (data.results || [])
      .filter((item: RawTmdbItem) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: RawTmdbItem) => {
        const isMovie = item.media_type === 'movie';
        const title = isMovie ? item.title : item.name;
        const releaseDate = isMovie ? item.release_date : item.first_air_date;
        const year = releaseDate ? releaseDate.split('-')[0] : null;

        return {
          id: item.id,
          tmdb_id: item.id,
          title: title || 'Untitled',
          media_type: isMovie ? 'movie' : 'series',
          year,
          poster_url: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : null,
          thumbnail_url: item.poster_path
            ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
            : null,
          vote_average: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
          overview: item.overview || null,
        };
      });

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message, results: [] },
      { status: 500 }
    );
  }
}

