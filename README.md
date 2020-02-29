# medium-draft-ts - [demo](https://dumistoklus.github.io/medium-draft-ts/)

A medium like rich WYSIWYG text editor built upon [draft-js](https://facebook.github.io/draft-js/) with an emphasis on eliminating mouse usage by adding relevant keyboard shortcuts.

This branch supports draft-js-plugins and can accept an array of plugins to
extend the functionalities.

## Priorities of project
- Best performance.
- Minimal package size.
- Typings for all.
- Good looking from box.
- Full customization and controllability.

## Installation
```npm i medium-draft-ts```

### Developer

- Clone this repo `git clone https://github.com/dumistoklus/medium-draft.git`.
- Install node packages `yarn install` or `npm i`.
- Start local demo `npm start` or `yarn start`. This will start a local server on port `8080`.

## API
Look at `src/demo.tsx` to insert editor it in your project.

### Image uploading

Create function `uploadImage`:
```
uploadImage(file: File): Promise<UploadImageData> {
    return fetch('http://www.example.net', {
        method: 'POST',
        body: file
    }).then((response) => {
        return response.json(); // if the response is a JSON object
    }).then((success) => {
        return {
            src: success.result.src,
            srcSet: success.result.srcSet,
            sizes: success.result.sizes,
            data: {
                id: success.result.id // if you parse result html you can get it as data-id attribute
            }
        };
    }).catch((error) => {
        return Promise.resolve({
            error: error.message
        });
    });
}
```

Then use it in `imageBlockPlugin` and `ImageButton` if need like that:
```
class App extends React.Component {
    private readonly plugins: DraftPlugin[] = [
        imageBlockPlugin({
            uploadImage
        }),
        ...more plugins
    ];

    private readonly sideButtons: SideButton[] = [
        {
            component: getImageButton({
                uploadImage
            }),
        },
        ...more buttons
    ];

    public render() {
        return (
            <MediumDraftEditor
                plugins={this.plugins}
                sideButtons={this.sideButtons}
                ...more options
            />
        );
    }
}
```

#### LICENSE

MIT
