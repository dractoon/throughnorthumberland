import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import EditPlace from "./EditPlace";

function Places() {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [editingPlace, setEditingPlace] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const placesPerPage = 10;

    useEffect(() => {
        loadPlaces();
    }, []);

    async function loadPlaces() {
        setLoading(true);
        setMessage("");

        const { data, error } = await supabase
            .from("places")
            .select(
                "id, slug, title, category, status, featured, created_at"
            )
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading places:", error);
            setMessage(error.message);
        } else {
            setPlaces(data || []);
        }

        setLoading(false);
    }

    async function toggleStatus(place) {
        const newStatus =
            place.status === "published"
                ? "hidden"
                : "published";

        const { error } = await supabase
            .from("places")
            .update({ status: newStatus })
            .eq("id", place.id);

        if (error) {
            setMessage(error.message);
            return;
        }

        setPlaces((currentPlaces) =>
            currentPlaces.map((item) =>
                item.id === place.id
                    ? { ...item, status: newStatus }
                    : item
            )
        );
    }

    async function toggleFeatured(place) {
        const newFeatured = !place.featured;

        const { error } = await supabase
            .from("places")
            .update({ featured: newFeatured })
            .eq("id", place.id);

        if (error) {
            setMessage(error.message);
            return;
        }

        setPlaces((currentPlaces) =>
            currentPlaces.map((item) =>
                item.id === place.id
                    ? { ...item, featured: newFeatured }
                    : item
            )
        );
    }

    async function deletePlace(place) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${place.title}"?`
        );

        if (!confirmed) {
            return;
        }

        const { error } = await supabase
            .from("places")
            .delete()
            .eq("id", place.id);

        if (error) {
            setMessage(error.message);
            return;
        }

        setPlaces((currentPlaces) =>
            currentPlaces.filter(
                (item) => item.id !== place.id
            )
        );
    }

    if (loading) {
        return (
            <section style={styles.section}>
                <p style={styles.muted}>Loading places...</p>
            </section>
        );
    }

    return (
        <section style={styles.section}>

            <div style={styles.sectionHeader}>
                <div>
                    <p style={styles.eyebrow}>
                        CONTENT
                    </p>

                    <h2 style={styles.heading}>
                        Places
                    </h2>

                    <p style={styles.muted}>
                        Manage the places that appear on
                        Through Northumberland.
                    </p>
                </div>

                <button
                    onClick={loadPlaces}
                    style={styles.refreshButton}
                >
                    Refresh
                </button>
            </div>
<div style={styles.searchRow}>

    <input
        type="text"
        placeholder="Search places..."
        value={searchTerm}
        onChange={(event) => {
            setSearchTerm(event.target.value);
            setCurrentPage(1);
        }}
        style={styles.searchInput}
    />

    <div style={styles.filterRow}>

        <button
            type="button"
            onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
            }}
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
            onClick={() => {
                setStatusFilter("published");
                setCurrentPage(1);
            }}
            style={{
                ...styles.filterButton,
                ...(statusFilter === "published"
                    ? styles.filterButtonActive
                    : {}),
            }}
        >
            Published
        </button>

        <button
            type="button"
            onClick={() => {
                setStatusFilter("hidden");
                setCurrentPage(1);
            }}
            style={{
                ...styles.filterButton,
                ...(statusFilter === "hidden"
                    ? styles.filterButtonActive
                    : {}),
            }}
        >
            Hidden
        </button>

        <button
            type="button"
            onClick={() => {
                setStatusFilter("featured");
                setCurrentPage(1);
            }}
            style={{
                ...styles.filterButton,
                ...(statusFilter === "featured"
                    ? styles.filterButtonActive
                    : {}),
            }}
        >
            Featured
        </button>

    </div>

</div>

            {message && (
                <div style={styles.message}>
                    {message}
                </div>
            )}

            {places.length === 0 ? (
                <div style={styles.empty}>
                    <h3>No places yet</h3>

                    <p style={styles.muted}>
                        Once you add your first place,
                        it will appear here.
                    </p>
                </div>
            ) : (
                <>
                    <div style={styles.list}>

                        {places
.filter((place) => {

    const term = searchTerm
        .trim()
        .toLowerCase();

    const matchesSearch =
        !term ||
        place.title
            ?.toLowerCase()
            .includes(term) ||
        place.category
            ?.toLowerCase()
            .includes(term);

    const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "featured"
            ? place.featured
            : place.status === statusFilter);

    return matchesSearch && matchesStatus;

})
                            .slice(
                                (currentPage - 1) * placesPerPage,
                                currentPage * placesPerPage
                            )
                            .map((place) => (

                                <div
                                    key={place.id}
                                    style={styles.placeCard}
                                >

                                    <div style={styles.placeInfo}>

                                        <div style={styles.placeTitleRow}>

                                            <h3 style={styles.placeTitle}>
                                                {place.title}
                                            </h3>

                                            <span
                                                style={{
                                                    ...styles.status,
                                                    ...(place.status === "published"
                                                        ? styles.published
                                                        : styles.hidden),
                                                }}
                                            >
                                                {place.status}
                                            </span>

                                        </div>

                                        <div style={styles.meta}>

                                            <span>
                                                {place.category}
                                            </span>

                                            <span>
                                                /places/{place.slug}
                                            </span>

                                            {place.featured && (
                                                <span style={styles.featured}>
                                                    Featured
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                    <div style={styles.actions}>

                                        <button
                                            onClick={() =>
                                                setEditingPlace(place)
                                            }
                                            style={styles.actionButton}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() =>
                                                toggleStatus(place)
                                            }
                                            style={styles.actionButton}
                                        >
                                            {place.status === "published"
                                                ? "Hide"
                                                : "Publish"}
                                        </button>

                                        <button
                                            onClick={() =>
                                                toggleFeatured(place)
                                            }
                                            style={styles.actionButton}
                                        >
                                            {place.featured
                                                ? "Unfeature"
                                                : "Feature"}
                                        </button>

                                        <button
                                            onClick={() =>
                                                deletePlace(place)
                                            }
                                            style={styles.deleteButton}
                                        >
                                            Delete
                                        </button>

                                    </div>

                                </div>

                            ))}

                    </div>

                    {(() => {

const filteredPlaces = places.filter((place) => {

    const term = searchTerm
        .trim()
        .toLowerCase();

    const matchesSearch =
        !term ||
        place.title
            ?.toLowerCase()
            .includes(term) ||
        place.category
            ?.toLowerCase()
            .includes(term);

    const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "featured"
            ? place.featured
            : place.status === statusFilter);

    return matchesSearch && matchesStatus;

});

                        const totalPages =
                            Math.ceil(
                                filteredPlaces.length / placesPerPage
                            );

                        if (totalPages <= 1) {
                            return null;
                        }

                        return (
                            <div style={styles.pagination}>

                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() =>
                                        setCurrentPage(currentPage - 1)
                                    }
                                    style={styles.paginationButton}
                                >
                                    ← Previous
                                </button>

                                <span style={styles.paginationInfo}>
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() =>
                                        setCurrentPage(currentPage + 1)
                                    }
                                    style={styles.paginationButton}
                                >
                                    Next →
                                </button>

                            </div>
                        );

                    })()}
                </>
            )}
        {editingPlace && (
            <EditPlace
                placeId={editingPlace.id}
                onCancel={() => setEditingPlace(null)}
                onSaved={() => {
                    setEditingPlace(null);
                    loadPlaces();
                }}
            />
        )}
        </section>
    );
}

const styles = {
    section: {
        marginTop: "30px",
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "20px",
        gap: "20px",
    },

    eyebrow: {
        color: "#315b55",
        fontSize: "13px",
        fontWeight: "bold",
        letterSpacing: "1px",
        margin: "0 0 8px",
    },

    heading: {
        color: "#202522",
        margin: "0 0 8px",
        fontSize: "30px",
    },

    muted: {
        color: "#68706b",
        lineHeight: "1.6",
        margin: 0,
    },

    refreshButton: {
        padding: "10px 18px",
        background: "#ffffff",
        color: "#315b55",
        border: "1px solid #315b55",
        borderRadius: "8px",
        cursor: "pointer",
    },

    message: {
        background: "#f2d8d3",
        color: "#8f382c",
        padding: "14px 16px",
        borderRadius: "10px",
        marginBottom: "20px",
    },

    empty: {
        background: "#ffffff",
        padding: "35px",
        borderRadius: "16px",
        textAlign: "center",
        boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
    },

    list: {
        display: "grid",
        gap: "12px",
    },

    placeCard: {
        background: "#ffffff",
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
    },

    placeInfo: {
        minWidth: 0,
        flex: 1,
    },

    placeTitleRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
    },

    placeTitle: {
        margin: 0,
        color: "#202522",
        fontSize: "18px",
    },

    status: {
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "bold",
        textTransform: "capitalize",
    },

    published: {
        background: "#dce7e3",
        color: "#315b55",
    },

    hidden: {
        background: "#f2d8d3",
        color: "#8f382c",
    },

    meta: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        marginTop: "8px",
        color: "#68706b",
        fontSize: "13px",
    },

    featured: {
        color: "#8a6a8c",
        fontWeight: "bold",
    },

    actions: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    },

    actionButton: {
        padding: "9px 13px",
        background: "#ffffff",
        color: "#315b55",
        border: "1px solid #315b55",
        borderRadius: "7px",
        cursor: "pointer",
    },

    deleteButton: {
        padding: "9px 13px",
        background: "#ffffff",
        color: "#c85c4a",
        border: "1px solid #c85c4a",
        borderRadius: "7px",
        cursor: "pointer",
    },
    searchRow: {
    marginBottom: "20px",
},

searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #dedbd2",
    borderRadius: "10px",
    fontSize: "16px",
    background: "#ffffff",
    color: "#202522",
},
filterRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "12px",
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
pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    marginTop: "25px",
},

paginationButton: {
    padding: "9px 14px",
    background: "#ffffff",
    color: "#315b55",
    border: "1px solid #315b55",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
},

paginationInfo: {
    color: "#68706b",
    fontSize: "14px",
    fontWeight: 600,
},
};

export default Places;