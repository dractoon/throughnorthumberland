import { useEffect, useState } from "react";
import { supabase } from "./supabase";

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        setLoading(true);
        setMessage("");

        const { data, error } = await supabase.rpc(
            "admin_list_users"
        );

        if (error) {
            console.error("Users error:", error);
            setMessage(
                "There was a problem loading registered users."
            );
            setLoading(false);
            return;
        }

        setUsers(data || []);
        setLoading(false);
    }

    async function toggleUser(user) {

    const action = user.disabled
        ? "enable"
        : "disable";

    const confirmed = window.confirm(
        `Are you sure you want to ${action} ${user.email}?`
    );

    if (!confirmed) {
        return;
    }

    setMessage("");

    const { error } = await supabase.rpc(
        "admin_set_user_disabled",
        {
            target_user_id: user.id,
            disabled: !user.disabled
        }
    );

    if (error) {
        console.error("User status error:", error);

        setMessage(
            `There was a problem trying to ${action} this user.`
        );

        return;
    }

    setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
            currentUser.id === user.id
                ? {
                    ...currentUser,
                    disabled: !currentUser.disabled
                }
                : currentUser
        )
    );
}
    const filteredUsers = users.filter((user) => {
        const email = (user.email || "").toLowerCase();
        const searchTerm = search.toLowerCase().trim();

        if (!searchTerm) return true;

        return email.includes(searchTerm);
    });

    function formatDate(date) {
        if (!date) return "—";

        return new Date(date).toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    }

    return (
        <section>

            <div style={styles.headingRow}>

                <div>
                    <p style={styles.eyebrow}>
                        USERS
                    </p>

                    <h2 style={styles.heading}>
                        Registered users
                    </h2>

                    <p style={styles.muted}>
                        View the people who have created an account.
                    </p>
                </div>

                <div style={styles.total}>
                    <strong style={styles.totalStrong}>
                        {users.length}
                    </strong>

                    <span>
                        registered
                    </span>
                </div>

            </div>

            <div style={styles.toolbar}>

                <input
                    type="search"
                    placeholder="Search by email..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                    style={styles.search}
                />

            </div>

            {loading && (
                <div style={styles.card}>
                    <p style={styles.muted}>
                        Loading users...
                    </p>
                </div>
            )}

            {message && (
                <div style={styles.message}>
                    {message}
                </div>
            )}

            {!loading && !message && (

                <div style={styles.card}>

                    <div style={styles.tableHeader}>
                        <span>User</span>
                        <span>Registered</span>
                        <span>Last sign in</span>
                        <span>Status</span>
                        <span></span>
                    </div>

                    {filteredUsers.length === 0 && (

                        <div style={styles.empty}>
                            <p>
                                No users found.
                            </p>
                        </div>

                    )}

                    {filteredUsers.map((user) => (

                    <div
    key={user.id}
    style={styles.row}
>

    <div style={styles.userCell}>

        <div style={styles.avatar}>
            {(user.email || "?")
                .charAt(0)
                .toUpperCase()}
        </div>

        <div>
            <strong style={styles.email}>
                {user.email}
            </strong>
        </div>

    </div>

    <span style={styles.date}>
        {formatDate(user.created_at)}
    </span>

    <span style={styles.date}>
        {formatDate(user.last_sign_in_at)}
    </span>

    <span
        style={{
            ...styles.status,
            ...(user.disabled
                ? styles.statusDisabled
                : styles.statusActive)
        }}
    >
        {user.disabled ? "Disabled" : "Active"}
    </span>

    <button
        type="button"
        onClick={() => toggleUser(user)}
        style={{
            ...styles.actionButton,
            ...(user.disabled
                ? styles.enableButton
                : styles.disableButton)
        }}
    >
        {user.disabled ? "Enable" : "Disable"}
    </button>

</div>

                    ))}

                </div>

            )}

        </section>
    );
}

const styles = {

    headingRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "30px",
        marginBottom: "25px",
    },

    eyebrow: {
        margin: "0 0 7px",
        color: "#315b55",
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "1.5px",
    },

    heading: {
        margin: "0 0 7px",
        color: "#202522",
        fontSize: "28px",
    },

    muted: {
        margin: 0,
        color: "#68706b",
        lineHeight: "1.6",
    },

    total: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        color: "#68706b",
    },

    totalstrong: {
        color: "#202522",
        fontSize: "28px",
        lineHeight: 1,
    },

    toolbar: {
        display: "flex",
        gap: "12px",
        marginBottom: "18px",
    },

    search: {
        width: "100%",
        maxWidth: "420px",
        padding: "12px 14px",
        boxSizing: "border-box",
        border: "1px solid #dedbd2",
        borderRadius: "10px",
        background: "#ffffff",
        fontSize: "14px",
        outline: "none",
    },

    card: {
        background: "#ffffff",
        border: "1px solid #dedbd2",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 5px 20px rgba(0,0,0,0.04)",
    },

    tableHeader: {
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 0.8fr 0.7fr",
        gap: "20px",
        padding: "14px 20px",
        background: "#f7f5ef",
        borderBottom: "1px solid #dedbd2",
        color: "#68706b",
        fontSize: "11px",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: "1px",
    },

    row: {
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 0.8fr 0.7fr",
        gap: "20px",
        alignItems: "center",
        padding: "18px 20px",
        borderBottom: "1px solid #eeeae2",
    },

    userCell: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: 0,
    },

    avatar: {
        width: "38px",
        height: "38px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: "#dce7e3",
        color: "#315b55",
        fontWeight: "700",
    },

    email: {
        display: "block",
        color: "#202522",
        fontSize: "14px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    date: {
        color: "#68706b",
        fontSize: "13px",
    },

    empty: {
        padding: "40px 20px",
        textAlign: "center",
        color: "#68706b",
    },
status: {
    display: "inline-block",
    width: "fit-content",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
},

statusActive: {
    background: "#dce7e3",
    color: "#315b55",
},

statusDisabled: {
    background: "#f2d8d3",
    color: "#8b3f32",
},

actionButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
},

disableButton: {
    border: "1px solid #e0b9b2",
    background: "#ffffff",
    color: "#8b3f32",
},

enableButton: {
    border: "1px solid #b8d2ca",
    background: "#ffffff",
    color: "#315b55",
},
    message: {
        padding: "15px 18px",
        marginBottom: "18px",
        borderRadius: "10px",
        background: "#f2d8d3",
        color: "#8b3f32",
    },
};

export default Users;