# Through Northumberland — holding page

A lightweight, static GitHub Pages holding page.

## Folder structure

```text
through-northumberland/
├── index.html
├── styles.css
├── README.md
└── assets/
    └── through-northumberland-mark.png
```

## Publish on GitHub Pages

1. Create a GitHub repository and upload **everything inside this folder** to the repository root.
2. In the repository, go to **Settings → Pages**.
3. Under the publishing source, choose the `main` branch and `/ (root)`.
4. Save. GitHub Pages will use `index.html` as the entry page.
5. Once published, open the Pages URL shown by GitHub.

## Connect your domain

After the site is working on GitHub Pages:

1. In **Settings → Pages**, enter your custom domain under **Custom domain** and save it.
2. At your domain provider, configure the DNS records GitHub gives you.
3. For an apex domain such as `example.com`, GitHub currently documents these A records:

   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`

   GitHub also supports the corresponding IPv6 AAAA records and ALIAS/ANAME records where the DNS provider supports them.
4. If you use `www`, create a CNAME for `www` pointing to your GitHub Pages hostname, e.g. `YOUR-USERNAME.github.io`.
5. Return to GitHub Pages and enable **Enforce HTTPS** when it becomes available.

## Important

Do not add a `CNAME` file until you know the actual domain name. When you add one, it must contain only the domain name, for example:

```text
throughnorthumberland.co.uk
```

The site deliberately uses relative asset paths (`assets/...`) so the same files work whether the site is hosted at a GitHub Pages repository URL or your own custom domain.
