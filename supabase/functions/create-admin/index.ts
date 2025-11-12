import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'

Deno.serve(async (req) => {
  try {
    // Simple security check - require a setup token
    const setupToken = req.headers.get('x-setup-token')
    const expectedToken = Deno.env.get('SETUP_TOKEN') || 'brototype-setup-2024'
    
    if (setupToken !== expectedToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { email, password, update_existing } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === email)

    let userId: string

    if (existingUser && update_existing) {
      // Update existing user's password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      )

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      userId = existingUser.id

      // Update role to admin if not already
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', userId)

      if (roleError) {
        return new Response(
          JSON.stringify({ error: roleError.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin user updated successfully',
          user_id: userId 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } else if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User already exists. Set update_existing=true to update.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create new user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'Admin User'
      }
    })

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userData.user.id, role: 'admin' })

    if (roleError) {
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        user_id: userData.user.id 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
