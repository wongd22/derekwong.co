import React, { useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import TagList from './TagList';

const ItemDetailsPanel = ({
  isOpen,
  setIsOpen,
  item,
  itemDetails,
  setItemDetails,
  onUpdateItem,
  newTagInput,
  setNewTagInput,
  isEditingTag,
  setIsEditingTag,
  editTagValue,
  setEditTagValue,
  tagSuggestions,
  onAddNewTag,
  onSelectExistingTag,
  onRemoveTag,
  onEditTag,
  onUpdateTag,
  onKeyDown,
  onImageUpload,
  isUploading,
  isSaving,
  uploadError,
  saveError
}) => {
  const [showLink, setShowLink] = useState(false);
  const [showPlace, setShowPlace] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const linkRef = useRef(null);
  const placeRef = useRef(null);
  const noteRef = useRef(null);

  useEffect(() => {
    setShowLink(Boolean(item?.url));
    setShowPlace(Boolean(item?.location));
    setShowNote(Boolean(item?.remarks));
  }, [item?.id, item?.url, item?.location, item?.remarks]);

  if (!item) return null;

  const openField = (setter, ref) => {
    setter(true);
    requestAnimationFrame(() => ref.current?.focus());
  };

  const locked = Boolean(item.pending);

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="shopping fixed inset-0 z-50 overflow-hidden"
        onClose={setIsOpen}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Dialog.Overlay className="absolute inset-0 bg-black/70 transition-opacity duration-200" />

          <div className="fixed inset-y-0 right-0 flex max-w-full">
            <Dialog.Panel className="flex h-full w-screen max-w-md flex-col border-l border-white/10 bg-black">
              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold tracking-tight text-neutral-100">
                    Details
                  </Dialog.Title>
                  <button
                    type="button"
                    className="grid size-11 place-items-center rounded-sm text-neutral-500 hover:text-neutral-100"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close"
                  >
                    <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>

                <input
                  type="text"
                  value={itemDetails.name}
                  aria-label="Name"
                  onChange={(event) => setItemDetails((prev) => ({ ...prev, name: event.target.value }))}
                  className="shop-field mt-8 w-full bg-transparent py-2 text-xl font-semibold tracking-tight text-neutral-100 placeholder:text-neutral-600"
                  placeholder="Name"
                />

                {locked && (
                  <p className="mt-3 text-sm text-neutral-500">Saving this one…</p>
                )}

                <div className="mt-8">
                  <p className="text-xs text-neutral-500">Optional</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    {!itemDetails.imageUrl && (
                      <PhotoAttachment
                        item={item}
                        itemDetails={itemDetails}
                        onImageUpload={onImageUpload}
                        isUploading={isUploading}
                        uploadError={uploadError}
                        locked={locked}
                      />
                    )}
                    {!showLink && !itemDetails.url && (
                      <button
                        type="button"
                        onClick={() => openField(setShowLink, linkRef)}
                        className="rounded-sm text-sm text-neutral-400 hover:text-neutral-100"
                      >
                        Add a link
                      </button>
                    )}
                    {!showPlace && !itemDetails.location && (
                      <button
                        type="button"
                        onClick={() => openField(setShowPlace, placeRef)}
                        className="rounded-sm text-sm text-neutral-400 hover:text-neutral-100"
                      >
                        Add a place
                      </button>
                    )}
                    {!showNote && !itemDetails.remarks && (
                      <button
                        type="button"
                        onClick={() => openField(setShowNote, noteRef)}
                        className="rounded-sm text-sm text-neutral-400 hover:text-neutral-100"
                      >
                        Add a note
                      </button>
                    )}
                  </div>

                  <div className="mt-4 space-y-5">
                    {itemDetails.imageUrl && (
                      <PhotoAttachment
                        item={item}
                        itemDetails={itemDetails}
                        onImageUpload={onImageUpload}
                        isUploading={isUploading}
                        uploadError={uploadError}
                        locked={locked}
                      />
                    )}

                    {(showLink || itemDetails.url) && (
                      <label className="block">
                        <span className="text-xs text-neutral-500">Link</span>
                        <input
                          ref={linkRef}
                          type="text"
                          inputMode="url"
                          value={itemDetails.url}
                          onChange={(event) => setItemDetails((prev) => ({ ...prev, url: event.target.value }))}
                          placeholder="https://"
                          className="shop-field mt-1 w-full bg-transparent py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
                        />
                      </label>
                    )}

                    {(showPlace || itemDetails.location) && (
                      <label className="block">
                        <span className="text-xs text-neutral-500">Place</span>
                        <input
                          ref={placeRef}
                          type="text"
                          value={itemDetails.location}
                          onChange={(event) => setItemDetails((prev) => ({ ...prev, location: event.target.value }))}
                          placeholder="Where you'd get it"
                          className="shop-field mt-1 w-full bg-transparent py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
                        />
                      </label>
                    )}

                    {(showNote || itemDetails.remarks) && (
                      <label className="block">
                        <span className="text-xs text-neutral-500">Note</span>
                        <textarea
                          ref={noteRef}
                          value={itemDetails.remarks}
                          onChange={(event) => setItemDetails((prev) => ({ ...prev, remarks: event.target.value }))}
                          rows={3}
                          placeholder="Anything you want to remember"
                          className="shop-field mt-1 w-full resize-none bg-transparent py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <TagList
                    itemDetails={itemDetails}
                    newTagInput={newTagInput}
                    setNewTagInput={setNewTagInput}
                    isEditingTag={isEditingTag}
                    setIsEditingTag={setIsEditingTag}
                    editTagValue={editTagValue}
                    setEditTagValue={setEditTagValue}
                    tagSuggestions={tagSuggestions}
                    onAddNewTag={onAddNewTag}
                    onSelectExistingTag={onSelectExistingTag}
                    onRemoveTag={onRemoveTag}
                    onEditTag={onEditTag}
                    onUpdateTag={onUpdateTag}
                    onKeyDown={onKeyDown}
                  />
                </div>
              </div>

              <div className="border-t border-white/10 p-4">
                {saveError && (
                  <p role="alert" className="mb-3 text-sm text-red-400">{saveError}</p>
                )}
                <button
                  type="button"
                  className="w-full rounded-[6px] bg-neutral-100 py-3 text-sm font-medium text-black hover:bg-white active:bg-neutral-300 disabled:opacity-50"
                  onClick={onUpdateItem}
                  disabled={isUploading || isSaving || locked}
                >
                  {isUploading ? 'Uploading photo…' : isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

const PhotoAttachment = ({
  item,
  itemDetails,
  onImageUpload,
  isUploading,
  uploadError,
  locked
}) => {
  if (itemDetails.imageUrl) {
    return (
      <div>
        <img
          src={itemDetails.imageUrl}
          alt=""
          className="aspect-[4/3] w-full rounded-[6px] object-cover"
        />
        <button
          type="button"
          onClick={() => onImageUpload(null, item)}
          disabled={isUploading || locked}
          className="mt-2 rounded-sm text-sm text-neutral-500 hover:text-neutral-200 disabled:opacity-50"
        >
          {isUploading ? 'Removing photo…' : 'Remove photo'}
        </button>
        {uploadError && (
          <p role="alert" className="mt-2 text-sm text-red-400">{uploadError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="contents">
      <label className={`inline-flex rounded-sm text-sm text-neutral-400 hover:text-neutral-100 ${locked || isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
        {isUploading ? 'Uploading photo…' : 'Add a photo'}
        <input
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImageUpload(file, item);
            event.target.value = '';
          }}
          disabled={isUploading || locked}
        />
      </label>
      {uploadError && (
        <p role="alert" className="w-full text-sm text-red-400">{uploadError}</p>
      )}
    </div>
  );
};

export default ItemDetailsPanel;
