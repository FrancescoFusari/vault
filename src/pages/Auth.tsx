import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/");
      }
      
      // Clear error when auth state changes
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") {
        setError(null);
      }

      // Handle auth errors
      if (event === "USER_UPDATED") {
        supabase.auth.getSession().then(({ error }) => {
          if (error) {
            handleAuthError(error);
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthError = (error: AuthError) => {
    console.error("Auth error:", error);
    
    // Parse the error message from the response body if available
    try {
      const bodyObj = JSON.parse(error.message);
      if (bodyObj.message) {
        setError(bodyObj.message);
        return;
      }
    } catch (e) {
      // If parsing fails, continue with default error handling
    }

    // Default error messages
    switch (error.message) {
      case "weak_password":
        setError("Password should be at least 6 characters long.");
        break;
      case "invalid_credentials":
        setError("Invalid email or password.");
        break;
      default:
        setError(error.message);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Welcome to Smart Notes</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-card p-6 rounded-lg shadow-lg space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          <p>Password requirements:</p>
          <ul className="list-disc list-inside">
            <li>Minimum 6 characters long</li>
          </ul>
        </div>

        <SupabaseAuth 
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'rgb(var(--primary))',
                  brandAccent: 'rgb(var(--primary))',
                }
              }
            }
          }}
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Auth;