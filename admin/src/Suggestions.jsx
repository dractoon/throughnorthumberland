import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Suggestions() {

    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    async function loadSuggestions() {

        setLoading(true);

        const {
            data,
            error
        } = await supabase
            .from("place_suggestions")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {

            console.error(error);

            setMessage(
                "Unable to load suggestions."
            );

            setLoading(false);

            return;
        }

        setSuggestions(data || []);

        setLoading(false);
    }


    useEffect(function () {

        loadSuggestions();

    }, []);


async function createPlaceFromSuggestion(suggestion) {

    setMessage("");

    const slug = suggestion.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const { data, error } = await supabase
        .from("places")
        .insert({
            title: suggestion.title,
            slug: slug,
            category: "Towns",
            description: suggestion.description,
            intro: suggestion.reason,
            address: suggestion.address || "",
            postcode: suggestion.postcode || "",
            website: suggestion.website || "",
            status: "hidden",
            featured: false,
            highlights: [],
            nearby: [],
            explore_categories: [],
        })
        .select()
        .single();

    if (error) {

        console.error(
            "Error creating place:",
            error
        );

        setMessage(
            `Unable to create place: ${error.message}`
        );

        return;
    }

    const { error: suggestionError } =
        await supabase
            .from("place_suggestions")
            .update({
                status: "approved"
            })
            .eq("id", suggestion.id);

    if (suggestionError) {

        console.error(
            "Error updating suggestion:",
            suggestionError
        );

        setMessage(
            `Place created, but suggestion status could not be updated: ${suggestionError.message}`
        );

        return;
    }

    setSuggestions(function (current) {

        return current.map(function (item) {

            if (item.id === suggestion.id) {

                return {
                    ...item,
                    status: "approved"
                };

            }

            return item;

        });

    });

    /*
     * Tell the parent/admin that a new place
     * has been created so it can be edited.
     */
    window.dispatchEvent(
        new CustomEvent(
            "tn-place-created",
            {
                detail: {
                    placeId: data.id
                }
            }
        )
    );

}
async function rejectSuggestion(suggestion) {

    setMessage("");

    const { error } = await supabase
        .from("place_suggestions")
        .update({
            status: "rejected"
        })
        .eq("id", suggestion.id);

    if (error) {

        console.error(
            "Error rejecting suggestion:",
            error
        );

        setMessage(
            `Unable to reject suggestion: ${error.message}`
        );

        return;
    }

    setSuggestions(function (current) {

        return current.map(function (item) {

            if (item.id === suggestion.id) {

                return {
                    ...item,
                    status: "rejected"
                };

            }

            return item;

        });

    });

}
async function deleteSuggestion(suggestion) {

    const confirmed = window.confirm(
        `Delete the suggestion "${suggestion.title}" permanently?`
    );

    if (!confirmed) {
        return;
    }

    setMessage("");

    const { error } = await supabase
        .from("place_suggestions")
        .delete()
        .eq("id", suggestion.id);

    if (error) {

        console.error(
            "Error deleting suggestion:",
            error
        );

        setMessage(
            `Unable to delete suggestion: ${error.message}`
        );

        return;
    }

    setSuggestions(function (current) {

        return current.filter(function (item) {
            return item.id !== suggestion.id;
        });

    });

}

    if (loading) {

        return (
            <section>
                <h2>Suggestions</h2>
                <p>Loading suggestions...</p>
            </section>
        );

    }


    return (
        <section style={styles.section}>

            <div style={styles.heading}>

                <div>

                    <h2>
                        Suggestions
                    </h2>

                    <p>
                        Places suggested by the community.
                    </p>

                </div>

                <span style={styles.count}>
                    {suggestions.filter(function (suggestion) {
                        return (
                            statusFilter === "all" ||
                            suggestion.status === statusFilter
                        );
                    }).length}
                </span>

            </div>


            {message && (
                <p style={styles.message}>
                    {message}
                </p>
            )}

<div style={styles.filterRow}>

    <button
        type="button"
        onClick={() => setStatusFilter("all")}
        style={{
            ...styles.filterButton,
            ...(statusFilter === "all"
                ? styles.filterButtonActive
                : {}),
        }}
    >
        All
    </button>

    <button
        type="button"
        onClick={() => setStatusFilter("pending")}
        style={{
            ...styles.filterButton,
            ...(statusFilter === "pending"
                ? styles.filterButtonActive
                : {}),
        }}
    >
        Under review
    </button>

    <button
        type="button"
        onClick={() => setStatusFilter("approved")}
        style={{
            ...styles.filterButton,
            ...(statusFilter === "approved"
                ? styles.filterButtonActive
                : {}),
        }}
    >
        Being prepared
    </button>

    <button
        type="button"
        onClick={() => setStatusFilter("rejected")}
        style={{
            ...styles.filterButton,
            ...(statusFilter === "rejected"
                ? styles.filterButtonActive
                : {}),
        }}
    >
        Rejected
    </button>

</div>
            {suggestions.length === 0 ? (

                <div style={styles.empty}>
                    <h3>No suggestions yet.</h3>

                    <p>
                        Community suggestions will appear here.
                    </p>
                </div>

            ) : (

                <div style={styles.list}>

                    {suggestions
    .filter(function (suggestion) {
        return (
            statusFilter === "all" ||
            suggestion.status === statusFilter
        );
    })
    .map(function (suggestion) {

                        return (
                            <article
                                key={suggestion.id}
                                style={styles.card}
                            >

                                <div style={styles.cardHeader}>

                                    <div>

                                        <span style={styles.type}>
                                            {suggestion.type}
                                        </span>

                                        <h3>
                                            {suggestion.title}
                                        </h3>

                                    </div>

                                    <span
                                        style={{
                                            ...styles.status,
                                            ...(suggestion.status === "pending"
                                                ? styles.pending
                                                : suggestion.status === "approved"
                                                    ? styles.approved
                                                    : styles.rejected)
                                        }}
                                    >
                                        {suggestion.status === "pending"
    ? "Under review"
    : suggestion.status === "approved"
        ? "Being prepared"
        : "Rejected"}
                                    </span>

                                </div>


                                <div style={styles.details}>

                                    <div>

                                        <strong>
                                            About
                                        </strong>

                                        <p>
                                            {suggestion.description}
                                        </p>

                                    </div>


                                    <div>

                                        <strong>
                                            Why they recommend it
                                        </strong>

                                        <p>
                                            {suggestion.reason}
                                        </p>

                                    </div>


                                    {suggestion.address && (
                                        <div>

                                            <strong>
                                                Address
                                            </strong>

                                            <p>
                                                {suggestion.address}
                                            </p>

                                        </div>
                                    )}


                                    {suggestion.postcode && (
                                        <div>

                                            <strong>
                                                Postcode
                                            </strong>

                                            <p>
                                                {suggestion.postcode}
                                            </p>

                                        </div>
                                    )}


                                    {suggestion.website && (
                                        <div>

                                            <strong>
                                                Website
                                            </strong>

                                            <p>
                                                {suggestion.website}
                                            </p>

                                        </div>
                                    )}

                                </div>


                                <div style={styles.actions}>

                                    {suggestion.website && (
                                        <a
                                            href={suggestion.website}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={styles.secondaryButton}
                                        >
                                            Visit website
                                        </a>
                                    )}


                                    {suggestion.status === "pending" && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    createPlaceFromSuggestion(suggestion)
                                                }
                                                style={styles.approveButton}
                                            >
                                                Create place
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    rejectSuggestion(suggestion)
                                                }
                                                style={styles.rejectButton}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {suggestion.status !== "pending" && (
    <button
        type="button"
        onClick={() =>
            deleteSuggestion(suggestion)
        }
        style={styles.deleteButton}
    >
        Delete
    </button>
)}


                                </div>

                            </article>
                        );

                    })}

                </div>

            )}

        </section>
    );
}


const styles = {

    section: {
        marginTop: "40px",
        marginBottom: "60px"
    },

    heading: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
    },

    count: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "36px",
        height: "36px",
        padding: "0 10px",
        borderRadius: "999px",
        background: "#dce7e3",
        color: "#315b55",
        fontWeight: 700
    },

    message: {
        padding: "12px 16px",
        background: "#f2d8d3",
        borderRadius: "10px",
        color: "#8c3e31"
    },

    empty: {
        padding: "30px",
        background: "#ffffff",
        border: "1px solid #dedbd2",
        borderRadius: "14px"
    },

    list: {
        display: "grid",
        gap: "18px"
    },

    card: {
        padding: "24px",
        background: "#ffffff",
        border: "1px solid #dedbd2",
        borderRadius: "16px"
    },

    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        marginBottom: "20px"
    },

    type: {
        display: "block",
        marginBottom: "5px",
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "#68706b"
    },

    status: {
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "capitalize"
    },

    pending: {
        background: "#f3e6c5",
        color: "#8a651d"
    },

    approved: {
        background: "#dce7e3",
        color: "#315b55"
    },

    rejected: {
        background: "#f2d8d3",
        color: "#8c3e31"
    },

    details: {
        display: "grid",
        gap: "16px",
        marginBottom: "20px"
    },

    actions: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        paddingTop: "18px",
        borderTop: "1px solid #dedbd2"
    },

    secondaryButton: {
        display: "inline-flex",
        alignItems: "center",
        padding: "9px 14px",
        border: "1px solid #dedbd2",
        borderRadius: "8px",
        color: "#202522",
        textDecoration: "none",
        fontWeight: 600
    },

    approveButton: {
        padding: "9px 14px",
        border: "0",
        borderRadius: "8px",
        background: "#315b55",
        color: "#ffffff",
        fontWeight: 600,
        cursor: "pointer"
    },

rejectButton: {
    padding: "10px 16px",
    background: "#f2d8d3",
    color: "#8f382c",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
},
deleteButton: {
    padding: "10px 16px",
    background: "#ffffff",
    color: "#c85c4a",
    border: "1px solid #c85c4a",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
},
filterRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "20px",
},

filterButton: {
    padding: "8px 14px",
    background: "#ffffff",
    color: "#68706b",
    border: "1px solid #dedbd2",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
},

filterButtonActive: {
    background: "#315b55",
    color: "#ffffff",
    borderColor: "#315b55",
},

};