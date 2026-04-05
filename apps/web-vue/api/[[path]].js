export async function onRequest(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await context.request.json();
    return Response.json({
      code: 0,
      msg: '请求成功',
      data: data
    }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({
      code: 0,
      msg: 'Hello from Pages Functions'
    }, { headers: corsHeaders });
  }
}