<script type="module">
  import { supabase } from '../../assets/js/lib/supabaseClient.js';
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) window.location.href = '../../auth/index.html';
</script>