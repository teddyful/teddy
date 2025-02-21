/**
 * Basic client search and filter services using vanilla JavaScript
 * for demo theme purposes only.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

/* -----------------------------------------------------------------------------
 * INITIALISATION
 * ---------------------------------------------------------------------------*/

// Blog page elements.
const elements = {
    blog: {
        listing: document.getElementById('blog-listing'), 
        notification: document.getElementById('blog-listing-notification'), 
        firstPost: document.getElementsByClassName('blog-post')[0], 
        loadMore: document.getElementById('blog-load-more'), 
        filters: {
            search: {
                form: document.getElementById('blog-search-form'), 
                input: document.getElementById('blog-search-query')
            }, 
            categories: document.getElementsByClassName('blog-category'), 
            reset: document.getElementById('blog-filters-reset')
        }
    }
}

// Initialise the search service.
const search = new Search();
let searchQuery = null;
let categoryFilter = null;
let hits = {};
let collectionDisplaySize = 0;

/* -----------------------------------------------------------------------------
 * BLOG SERVICES
 * ---------------------------------------------------------------------------*/

// Reset the blog view.
async function resetBlog() {
    searchQuery = null;
    categoryFilter = null;
    elements.blog.filters.search.input.value = '';
    Array.from(elements.blog.filters.categories).forEach(function(elem) {
        elem.classList.remove('active');
    });
    await updateBlog();
}

// Update the blog view with the current search parameters and hits.
async function updateBlog(loadMore = false) {
    if ( !loadMore ) {
        hits = {};
        collectionDisplaySize = 0;
        elements.blog.notification.style.display = 'block';
        elements.blog.listing.innerHTML = '';
    }
    await doSearch();
    renderSearchResults();
}

// Request the search service.
async function doSearch() {

    // No search query and no category filter.
    if ( searchQuery == null && categoryFilter == null ) {
        hits = await search.getDocuments(collectionDisplaySize, 
            COLLECTION_PAGINATION_SIZE);
    }

    // Search query with no category filter.
    else if ( searchQuery !== null && categoryFilter == null ) {
        hits = await search.query(searchQuery, 
            collectionDisplaySize, COLLECTION_PAGINATION_SIZE);
    }

    // Search query with category filter.
    else if ( searchQuery !== null && categoryFilter !== null ) {
        hits = await search.queryAndFilterByTags(searchQuery, categoryFilter, 
            collectionDisplaySize, COLLECTION_PAGINATION_SIZE);
    }

    // Category filter with no search query.
    else if ( searchQuery == null && categoryFilter !== null ) {
        hits = await search.getDocumentsByTags(categoryFilter, 
            collectionDisplaySize, COLLECTION_PAGINATION_SIZE);
    }

}

// Render search results.
function renderSearchResults() {

    if ( hits.length > 0 ) {

        // Hide the zero results notification.
        elements.blog.notification.style.display = 'none';

        // Iterate over the hits.
        for ( const doc of hits ) {

            // Generate the blog post element and append it to the blog listing.
            let post = elements.blog.firstPost.cloneNode(true);
            let postImage = post.getElementsByClassName('blog-post-img')[0];
            postImage.setAttribute('src', `${doc.relUrl}/${doc.cover}`);
            postImage.setAttribute('alt', doc.name);
            let postTitle = post.getElementsByClassName('blog-post-title')[0];
            postTitle.setAttribute('href', doc.relUrl);
            postTitle.innerHTML = doc.name;
            let postAuthor = post.getElementsByClassName('blog-post-author')[0];
            postAuthor.setAttribute('href', doc.authorUrl);
            postAuthor.innerHTML = doc.author;
            let postDate = post.getElementsByClassName('blog-post-date')[0];
            postDate.innerHTML = doc.displayDate;
            let postDescription = post.getElementsByClassName(
                'blog-post-description')[0];
            postDescription.innerHTML = doc.description;
            let postReadMore = post.getElementsByClassName(
                'blog-post-read-more')[0];
            postReadMore.setAttribute('href', doc.relUrl);
            let categories = '';
            for ( const category of doc.categoryLanguages ) {
                categories += category.name
            }
            let postCategories = post.getElementsByClassName(
                'blog-post-categories')[0];
            postCategories.innerHTML = categories;

            // Append the post to the blog listing & increment the display size.
            elements.blog.listing.innerHTML = 
                elements.blog.listing.innerHTML + post.outerHTML;
            collectionDisplaySize++;

        }

    }

    // Display the load more button.
    if ( hits.length < COLLECTION_PAGINATION_SIZE ) {
        elements.blog.loadMore.style.display = 'none';
    } else {
        elements.blog.loadMore.style.display = 'inline-block';
    }

}

/* -----------------------------------------------------------------------------
 * EVENT HANDLERS
 * ---------------------------------------------------------------------------*/

// Load more event handler.
elements.blog.loadMore.addEventListener('click', async function(e) {
    await updateBlog(true);
}, false);

// Form submission event handler.
elements.blog.filters.search.form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const rawQuery = elements.blog.filters.search.input.value;
    const sanitizedQuery = Search.sanitizeQuery(rawQuery);
    if ( ( sanitizedQuery.length >= MIN_SEARCH_QUERY_LENGTH ) || 
        rawQuery.length == 0 ) {
        searchQuery = rawQuery.length == 0 ? null : sanitizedQuery;
        await updateBlog();
    }
}, false);

// Category filter event handler.
Array.from(elements.blog.filters.categories).forEach(function(categoryElem) {
    categoryElem.addEventListener('click', async function(e) {
        e.preventDefault();
        
        // Deselect category filter.
        if ( e.target.classList.contains('active') ) {
            Array.from(elements.blog.filters.categories).forEach(
                function(elem) {
                    elem.classList.remove('active');
                });
            categoryFilter = null;
            
        } 
        
        // Select category filter.
        else {
            Array.from(elements.blog.filters.categories).forEach(
                function(elem) {
                    elem.classList.remove('active');
                });
            e.target.classList.add('active');
            categoryFilter = e.target.getAttribute('data-category-id');
        }

        await updateBlog();
        
    }, false);
});

// Reset filters event handler.
elements.blog.filters.reset.addEventListener('click', async function(e) {
    await resetBlog();
}, false);

// Page load event handler.
document.addEventListener('DOMContentLoaded', async function(e) {
    await search.loadIndex();
    await resetBlog();
});
