import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import Places from "./Places";
import AddPlace from "./AddPlace";
import Categories from "./Categories";
import Suggestions from "./Suggestions";
import EditPlace from "./EditPlace";
function App() {
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [showAddPlace, setShowAddPlace] = useState(false);
    const [editingPlaceId, setEditingPlaceId] = useState(null);
    const [activeSection, setActiveSection] = useState("dashboard");

    useEffect(() => {
        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);

            if (!session) {
                setIsAdmin(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);
    useEffect(() => {

    function handlePlaceCreated(event) {

        setEditingPlaceId(
            event.detail.placeId
        );

    }

    window.addEventListener(
        "tn-place-created",
        handlePlaceCreated
    );

    return () => {

        window.removeEventListener(
            "tn-place-created",
            handlePlaceCreated
        );

    };

}, []);

    async function checkSession() {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        setSession(session);

        if (session) {
            await checkAdmin();
        }

        setLoading(false);
    }

    async function checkAdmin() {
        const { data, error } = await supabase.rpc("is_admin");

        if (error) {
            console.error("Admin check error:", error);
            setMessage("There was a problem checking admin access.");
            return;
        }

        if (data === true) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
            setMessage("This account does not have admin access.");
        }
    }

    async function handleLogin(event) {
        event.preventDefault();

        setLoading(true);
        setMessage("");

        const email = event.target.email.value;
        const password = event.target.password.value;

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setMessage(error.message);
        } else {
            await checkAdmin();
        }

        setLoading(false);
    }

    async function handleLogout() {
        await supabase.auth.signOut();

        setSession(null);
        setIsAdmin(false);
        setMessage("");
    }

    if (loading) {
        return (
            <main style={styles.page}>
                <p>Loading...</p>
            </main>
        );
    }

    if (!session) {
        return (
            <main style={styles.page}>
                <div style={styles.card}>
                    <h1 style={styles.heading}>
                        Through Northumberland
                    </h1>

                    <p style={styles.muted}>
                        Admin login
                    </p>

                    <form onSubmit={handleLogin}>

                        <label style={styles.label}>
                            Email
                        </label>

                        <input
                            name="email"
                            type="email"
                            required
                            style={styles.input}
                        />

                        <label style={styles.label}>
                            Password
                        </label>

                        <input
                            name="password"
                            type="password"
                            required
                            style={styles.input}
                        />

                        <button
                            type="submit"
                            style={styles.button}
                        >
                            Log in
                        </button>

                    </form>

                    {message && (
                        <p style={styles.message}>
                            {message}
                        </p>
                    )}
                </div>
            </main>
        );
    }

    if (!isAdmin) {
        return (
            <main style={styles.page}>
                <div style={styles.card}>
                    <h1 style={styles.heading}>
                        Access denied
                    </h1>

                    <p style={styles.muted}>
                        Your account is logged in, but it does not
                        have admin access.
                    </p>

                    <button
                        onClick={handleLogout}
                        style={styles.button}
                    >
                        Log out
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main style={styles.page}>
            <div style={styles.dashboard}>
<div style={styles.navigation}>

    <button
        type="button"
        onClick={() => setActiveSection("dashboard")}
        style={{
            ...styles.navButton,
            ...(activeSection === "dashboard"
                ? styles.navButtonActive
                : {})
        }}
    >
        Dashboard
    </button>

    <button
        type="button"
        onClick={() => setActiveSection("places")}
        style={{
            ...styles.navButton,
            ...(activeSection === "places"
                ? styles.navButtonActive
                : {})
        }}
    >
        Places
    </button>

    <button
        type="button"
        onClick={() => setActiveSection("suggestions")}
        style={{
            ...styles.navButton,
            ...(activeSection === "suggestions"
                ? styles.navButtonActive
                : {})
        }}
    >
        Suggestions
    </button>

    <button
        type="button"
        onClick={() => setActiveSection("categories")}
        style={{
            ...styles.navButton,
            ...(activeSection === "categories"
                ? styles.navButtonActive
                : {})
        }}
    >
        Categories
    </button>

</div>
                <div style={styles.header}>
                    <div>
                        <p style={styles.eyebrow}>
                            THROUGH NORTHUMBERLAND
                        </p>

                        <h1 style={styles.heading}>
                            Admin Dashboard
                        </h1>
                    </div>

                    <button
                        onClick={handleLogout}
                        style={styles.logoutButton}
                    >
                        Log out
                    </button>
                </div>

                {activeSection === "dashboard" && (

                    <div style={styles.welcomeCard}>
                        <h2>
                            Welcome back 👋
                        </h2>

                        <p style={styles.muted}>
                            You're successfully logged in as an administrator.
                        </p>
                    </div>

                )}

{activeSection === "dashboard" && (

    <div style={styles.dashboardGrid}>

        <div style={styles.dashboardCard}>
            <h3>Places</h3>

            <p>
                Add, edit, publish and hide places.
            </p>

            <button
                onClick={() => {
                    setActiveSection("places");
                    setShowAddPlace(true);
                }}
                style={styles.cardButton}
            >
                Add a place
            </button>
        </div>

        <div style={styles.dashboardCard}>
            <h3>Categories & Features</h3>

            <p>
                Manage the categories and features used
                throughout Explore.
            </p>

            <button
                type="button"
                onClick={() => setActiveSection("categories")}
                style={styles.cardButton}
            >
                Manage
            </button>
        </div>

        <div style={styles.dashboardCard}>
            <h3>Featured</h3>

            <p>
                Choose which places appear as featured.
            </p>
        </div>

        <div style={styles.dashboardCard}>
            <h3>Suggestions</h3>

            <p>
                Review places suggested by the community.
            </p>

            <button
                type="button"
                onClick={() => setActiveSection("suggestions")}
                style={styles.cardButton}
            >
                Review
            </button>
        </div>

    </div>

)}

{activeSection === "places" && (
    <Places />
)}

{editingPlaceId && (
    <EditPlace
        placeId={editingPlaceId}
        onCancel={() => setEditingPlaceId(null)}
        onSaved={() => {
    setEditingPlaceId(null);
    window.location.reload();
}}
    />
)}

{activeSection === "suggestions" && (
    <div id="suggestions">
        <Suggestions />
    </div>
)}
{activeSection === "categories" && (
    <div id="categories">
        <Categories />
    </div>
)}
                {showAddPlace && (
                    <AddPlace
                        onCancel={() => setShowAddPlace(false)}
                        onPlaceAdded={() => {
                            setShowAddPlace(false);
                            window.location.reload();
                        }}
                    />
                )}

            </div>
        </main>
    );
    
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f4f1e9",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        boxSizing: "border-box",
    },

    card: {
        width: "100%",
        maxWidth: "420px",
        background: "#ffffff",
        padding: "40px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        boxSizing: "border-box",
    },

dashboard: {
    width: "100%",
    maxWidth: "1100px",
    alignSelf: "flex-start",
    margin: "30px auto",
},

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
    },

    eyebrow: {
        color: "#315b55",
        fontSize: "13px",
        fontWeight: "bold",
        letterSpacing: "1px",
        marginBottom: "8px",
    },

    heading: {
        color: "#202522",
        marginTop: 0,
        marginBottom: "8px",
    },

    muted: {
        color: "#68706b",
        lineHeight: "1.6",
    },

    label: {
        display: "block",
        marginBottom: "6px",
        color: "#202522",
        fontWeight: "bold",
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        marginBottom: "20px",
        border: "1px solid #dedbd2",
        borderRadius: "8px",
        fontSize: "16px",
    },

    button: {
        width: "100%",
        padding: "13px",
        background: "#315b55",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        cursor: "pointer",
    },

    logoutButton: {
        padding: "10px 18px",
        background: "#ffffff",
        color: "#315b55",
        border: "1px solid #315b55",
        borderRadius: "8px",
        cursor: "pointer",
    },

    message: {
        marginTop: "20px",
        color: "#c85c4a",
    },

    welcomeCard: {
        background: "#ffffff",
        padding: "30px",
        borderRadius: "16px",
        marginBottom: "25px",
        boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
    },

    dashboardGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
    },

    dashboardCard: {
        background: "#ffffff",
        padding: "25px",
        borderRadius: "16px",
        boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
    },
    cardButton: {
    marginTop: "15px",
    padding: "10px 16px",
    background: "#315b55",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
},
navigation: {
    display: "flex",
    gap: "8px",
    marginBottom: "25px",
    padding: "6px",
    background: "#ffffff",
    border: "1px solid #dedbd2",
    borderRadius: "12px",
    position: "sticky",
    top: "15px",
    zIndex: 100,
},

navButton: {
    flex: 1,
    padding: "11px 16px",
    background: "transparent",
    color: "#68706b",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
},

navButtonActive: {
    background: "#315b55",
    color: "#ffffff",
},
};

export default App;